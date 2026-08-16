"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KUWAIT_GOVERNORATES } from "@/lib/kuwait-areas";
import { setStorefrontArea } from "@/actions/storefront-area";
import { toast } from "sonner";
import { Loader2, MapPin, Plus, TicketPercent, Gift } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCartStore, cartLineKey, isCheckoutLine, isGiftCardLine } from "@/store/cart-store";
import { cartSubtotal } from "@/lib/cart-totals";
import { lineExtrasTotalKwd } from "@/lib/pricing";
import {
  DELIVERY_AREAS,
  deliveryFeeWithFreeThreshold,
  formatDeliveryEta,
} from "@/lib/delivery";
import { DELIVERY_TIME_SLOTS } from "@/lib/checkout-constants";
import { formatKwd } from "@/lib/format";
import { formatStructuredAddress } from "@/lib/checkout-address";
import { LocationPicker, type LatLng } from "@/components/checkout/location-picker";
import { createOrder } from "@/actions/orders";
import { setStorefrontPickupBranch } from "@/actions/storefront-pickup-branch";
import {
  pickupBranchDisplayLabel,
  type PickupBranchOption,
} from "@/lib/pickup-branch";
import { validatePromoCode } from "@/actions/promo-codes";
import { validateLoyaltyCodeAtCheckout } from "@/actions/loyalty-redeem";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCustomerAuth } from "@/components/auth/customer-auth-provider";
import { GiftDeliverySummaryLine } from "@/components/gifts/gift-delivery-summary";

type AddressMode = "saved" | "new";

type AppliedDiscount =
  | {
      kind: "promo";
      code: string;
      type: "PERCENT" | "FIXED" | "FREE_SHIPPING" | "BUY_X_GET_Y";
      subtotalDiscount: number;
      deliveryDiscount: number;
    }
  | {
      kind: "loyalty";
      code: string;
      discountKwd: number;
      walletOverflowKwd: number;
    };

type CheckoutFormProps = {
  storefrontAreaId: string | null;
  storefrontAreaLabel: string | null;
  selectedGovernorateKey: string | null;
  selectedAreaKey: string | null;
  deliveryAvailable: boolean;
  branchDeliveryFeeKwd: number | null;
  pickupBranches: PickupBranchOption[];
  initialPickupBranchId: string | null;
};

export function CheckoutForm({
  storefrontAreaId,
  storefrontAreaLabel,
  selectedGovernorateKey,
  selectedAreaKey,
  deliveryAvailable,
  branchDeliveryFeeKwd,
  pickupBranches,
  initialPickupBranchId,
}: CheckoutFormProps) {
  const { t, locale } = useI18n();
  const router = useRouter();

  // Governorate + area shown at the top of the address form. Changing them
  // updates the storefront-wide selection (menu, fees) as well.
  const [addrGovKey, setAddrGovKey] = React.useState(
    selectedGovernorateKey ?? KUWAIT_GOVERNORATES[0]!.key
  );
  const addrGovernorate = KUWAIT_GOVERNORATES.find((g) => g.key === addrGovKey);
  const [addrAreaKey, setAddrAreaKey] = React.useState(
    selectedAreaKey ?? ""
  );

  async function onAddrAreaChange(areaKey: string) {
    setAddrAreaKey(areaKey);
    if (!areaKey) return;
    const res = await setStorefrontArea(addrGovKey, areaKey);
    if (res.ok) router.refresh();
  }
  const { user, ready, refreshUser } = useCustomerAuth();
  const lines = useCartStore((s) => s.lines);
  const checkoutLines = lines.filter(isCheckoutLine);
  // Gift cards are delivered by email — no fulfillment or address needed.
  const giftCardsOnly =
    checkoutLines.length > 0 && checkoutLines.every(isGiftCardLine);
  const clear = useCartStore((s) => s.clear);
  const [pending, setPending] = React.useState(false);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [street, setStreet] = React.useState("");
  const [block, setBlock] = React.useState("");
  const [city, setCity] = React.useState("");
  const [houseNumber, setHouseNumber] = React.useState("");
  const [floor, setFloor] = React.useState("");
  const [doorNumber, setDoorNumber] = React.useState("");
  const [addressNotes, setAddressNotes] = React.useState("");
  const [pin, setPin] = React.useState<LatLng | null>(null);
  const [area, setArea] = React.useState(
    storefrontAreaId ?? DELIVERY_AREAS[0]!.id
  );
  const [slot, setSlot] = React.useState(DELIVERY_TIME_SLOTS[0]!);
  const [scheduledDate, setScheduledDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "KNET" | "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "CASH_ON_DELIVERY"
  >("KNET");
  const [fulfillment, setFulfillment] = React.useState<
    "DELIVERY" | "PICKUP" | "SCHEDULED"
  >("DELIVERY");

  React.useEffect(() => {
    if (giftCardsOnly && fulfillment !== "PICKUP") setFulfillment("PICKUP");
  }, [giftCardsOnly, fulfillment]);
  const defaultPickupBranchId =
    initialPickupBranchId ?? pickupBranches[0]?.id ?? "";
  const [pickupBranchId, setPickupBranchId] = React.useState(
    defaultPickupBranchId
  );

  const [promoInput, setPromoInput] = React.useState("");
  const [appliedDiscount, setAppliedDiscount] =
    React.useState<AppliedDiscount | null>(null);
  const [promoChecking, setPromoChecking] = React.useState(false);

  const [applyStoreCredit, setApplyStoreCredit] = React.useState(false);

  const [saveAddress, setSaveAddress] = React.useState(true);

  const [addressMode, setAddressMode] = React.useState<AddressMode>("new");
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    if (!ready) return;
    if (!user) {
      setAddressMode("new");
      setSelectedAddressId(null);
      return;
    }
    setName(user.fullName);
    setPhone(user.phone);
    if (user.addresses.length > 0) {
      setAddressMode("saved");
      setSelectedAddressId(user.addresses[0]!.id);
    } else {
      setAddressMode("new");
      setSelectedAddressId(null);
    }
  }, [ready, user?.id, user?.addresses.length, user]);

  const selectedSaved = user?.addresses.find((a) => a.id === selectedAddressId);

  const effectiveArea =
    storefrontAreaId ??
    (user && addressMode === "saved" && selectedSaved
      ? selectedSaved.deliveryAreaId
      : area);

  React.useEffect(() => {
    if (
      !deliveryAvailable &&
      (fulfillment === "DELIVERY" || fulfillment === "SCHEDULED")
    ) {
      setFulfillment("PICKUP");
    }
  }, [deliveryAvailable, fulfillment]);

  React.useEffect(() => {
    if (fulfillment !== "PICKUP" || !pickupBranchId.trim()) return;
    void setStorefrontPickupBranch(pickupBranchId);
  }, [fulfillment, pickupBranchId]);

  const subtotal = cartSubtotal(checkoutLines);
  const baseFee =
    fulfillment === "PICKUP"
      ? 0
      : deliveryAvailable && branchDeliveryFeeKwd != null
        ? deliveryFeeWithFreeThreshold(subtotal, branchDeliveryFeeKwd)
        : 0;

  // Apply discounts
  const promoSubtotalDiscount =
    appliedDiscount?.kind === "promo" ? appliedDiscount.subtotalDiscount : 0;
  const promoDeliveryDiscount =
    appliedDiscount?.kind === "promo" ? appliedDiscount.deliveryDiscount : 0;
  const subtotalAfterPromo = Math.max(0, subtotal - promoSubtotalDiscount);
  const feeAfterPromo = Math.max(0, baseFee - promoDeliveryDiscount);

  const loyaltyDiscount =
    appliedDiscount?.kind === "loyalty" ? appliedDiscount.discountKwd : 0;

  const storeCreditBalance = user?.storeCreditKwd ?? 0;

  // Loyalty code and store credit reduce the product subtotal only — the
  // delivery fee is always charged in full and added back on top.
  const productsAfterLoyalty = Math.max(0, subtotalAfterPromo - loyaltyDiscount);

  const storeCreditApplied =
    applyStoreCredit && storeCreditBalance > 0
      ? Math.min(storeCreditBalance, productsAfterLoyalty)
      : 0;
  const total =
    Math.max(0, productsAfterLoyalty - storeCreditApplied) + feeAfterPromo;

  // How much the promo / loyalty code shaved off this order — surfaced
  // prominently before payment so the customer sees their savings.
  const totalSavings =
    Math.round(
      (promoSubtotalDiscount + promoDeliveryDiscount + loyaltyDiscount) * 1000
    ) / 1000;

  const tierEarnRate = (user?.loyaltyEarnPercent ?? 2) / 100;
  const pointsPerKwd =
    user?.redemptionValueKwd && user?.redemptionPoints
      ? user.redemptionPoints / user.redemptionValueKwd
      : 200;
  const estimatedPointsEarned =
    user && user.loyaltyEnabled !== false
      ? Math.floor(subtotalAfterPromo * tierEarnRate * pointsPerKwd)
      : 0;

  function validateContactAndAddress(): boolean {
    if (!name.trim()) {
      toast.error(t("checkout.validation.name"));
      return false;
    }
    if (!phone.trim()) {
      toast.error(t("checkout.validation.phone"));
      return false;
    }
    if (fulfillment === "PICKUP") {
      if (!pickupBranchId.trim()) {
        toast.error(t("checkout.validation.pickupBranch"));
        return false;
      }
      return true;
    }
    const usingNewAddress =
      !user || addressMode === "new" || user.addresses.length === 0;
    if (usingNewAddress) {
      if (!street.trim()) {
        toast.error(t("checkout.validation.street"));
        return false;
      }
      if (!block.trim()) {
        toast.error(t("checkout.validation.block"));
        return false;
      }
      if (!houseNumber.trim()) {
        toast.error(t("checkout.validation.houseNumber"));
        return false;
      }
      // Pinning the location is optional — the address fields are enough.
    }
    if (fulfillment === "SCHEDULED" && !scheduledDate) {
      toast.error(t("checkout.validation.scheduledDate"));
      return false;
    }
    if (
      (fulfillment === "DELIVERY" || fulfillment === "SCHEDULED") &&
      !deliveryAvailable
    ) {
      toast.error(t("checkout.area.notCovered"));
      return false;
    }
    if (
      (fulfillment === "DELIVERY" || fulfillment === "SCHEDULED") &&
      !storefrontAreaId
    ) {
      toast.error(t("checkout.area.chooseFirst"));
      return false;
    }
    return true;
  }

  function buildPayloadAddress(): {
    composed: string;
    deliveryAreaId: string;
    latitude: number | null;
    longitude: number | null;
    street: string;
    block: string;
    city: string;
    houseNumber: string;
    floor: string;
    doorNumber: string;
  } {
    if (fulfillment === "PICKUP") {
      const branchLabel = pickupBranchDisplayLabel(
        pickupBranchId,
        locale,
        pickupBranches
      );
      return {
        composed: `${t("checkout.pickup.label")}: ${branchLabel}`,
        deliveryAreaId: "pickup",
        latitude: null,
        longitude: null,
        street: "",
        block: "",
        city: "",
        houseNumber: "",
        floor: "",
        doorNumber: "",
      };
    }
    if (user && addressMode === "saved" && selectedSaved) {
      return {
        composed: formatStructuredAddress({
          street: selectedSaved.street,
          block: selectedSaved.block,
          city: selectedSaved.city,
          houseNumber: selectedSaved.houseNumber,
          floor: selectedSaved.floor,
          doorNumber: selectedSaved.doorNumber,
          additionalNotes: selectedSaved.additionalNotes,
          deliveryAreaId: selectedSaved.deliveryAreaId,
        }),
        deliveryAreaId: selectedSaved.deliveryAreaId,
        latitude: selectedSaved.latitude,
        longitude: selectedSaved.longitude,
        street: selectedSaved.street,
        block: selectedSaved.block,
        city: selectedSaved.city,
        houseNumber: selectedSaved.houseNumber,
        floor: selectedSaved.floor,
        doorNumber: selectedSaved.doorNumber,
      };
    }
    return {
      composed: formatStructuredAddress({
        street: street.trim(),
        block: block.trim(),
        city: city.trim(),
        houseNumber: houseNumber.trim(),
        floor: floor.trim(),
        doorNumber: doorNumber.trim(),
        additionalNotes: addressNotes.trim(),
        deliveryAreaId: storefrontAreaId ?? area,
      }),
      deliveryAreaId: storefrontAreaId ?? area,
      latitude: pin?.lat ?? null,
      longitude: pin?.lng ?? null,
      street: street.trim(),
      block: block.trim(),
      city: city.trim(),
      houseNumber: houseNumber.trim(),
      floor: floor.trim(),
      doorNumber: doorNumber.trim(),
    };
  }

  async function onApplyPromo() {
    if (!promoInput.trim()) return;
    setPromoChecking(true);
    // Loyalty codes apply to the product subtotal only, never the delivery fee.
    const orderTotalBeforeCode = subtotalAfterPromo;
    const promoLines = checkoutLines
      .filter((l) => (l.kind ?? "product") === "product")
      .map((l) => ({
        productId: l.productId,
        lineTotal:
          l.price * l.quantity +
          lineExtrasTotalKwd(l.quantity, l.giftWrap, l.extraToppings),
      }));

    const promoRes = await validatePromoCode({
      code: promoInput.trim(),
      subtotal,
      deliveryFee: baseFee,
      lines: promoLines,
    });
    if (promoRes.ok) {
      setAppliedDiscount({
        kind: "promo",
        code: promoRes.code,
        type: promoRes.type,
        subtotalDiscount: promoRes.subtotalDiscount,
        deliveryDiscount: promoRes.deliveryDiscount,
      });
      toast.success(t("checkout.promo.applied", { code: promoRes.code }));
      setPromoChecking(false);
      return;
    }

    // Loyalty wallet codes are formatted "LR-...". Anything else is a promo, so
    // surface the real promo error instead of masking it with a loyalty message.
    if (!/^LR-/i.test(promoInput.trim())) {
      setPromoChecking(false);
      toast.error(t(`checkout.promo.error.${promoRes.code}` as const));
      return;
    }

    const loyaltyRes = await validateLoyaltyCodeAtCheckout({
      code: promoInput.trim(),
      orderTotalKwd: orderTotalBeforeCode,
    });
    setPromoChecking(false);
    if (!loyaltyRes.ok) {
      toast.error(t(`checkout.loyaltyCode.error.${loyaltyRes.code}` as const));
      return;
    }
    setAppliedDiscount({
      kind: "loyalty",
      code: loyaltyRes.code,
      discountKwd: loyaltyRes.discountKwd,
      walletOverflowKwd: loyaltyRes.walletOverflowKwd,
    });
    toast.success(
      t("checkout.loyaltyCode.applied", { code: loyaltyRes.code })
    );
  }

  function onClearDiscount() {
    setAppliedDiscount(null);
    setPromoInput("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checkoutLines.length) {
      toast.error(t("checkout.toast.empty"));
      return;
    }
    if (!validateContactAndAddress()) return;

    const addr = buildPayloadAddress();
    const { composed, deliveryAreaId } = addr;

    setPending(true);
    const res = await createOrder({
      customerName: name.trim(),
      customerEmail: user?.email ?? null,
      phone: phone.trim(),
      address: composed,
      latitude: addr.latitude,
      longitude: addr.longitude,
      addressStreet: addr.street,
      addressBlock: addr.block,
      addressCity: addr.city,
      addressHouseNumber: addr.houseNumber,
      addressFloor: addr.floor,
      addressDoorNumber: addr.doorNumber,
      deliveryArea: deliveryAreaId,
      deliverySlot: slot,
      scheduledDate: fulfillment === "SCHEDULED" && scheduledDate ? scheduledDate : null,
      customerNotes: notes,
      customerUserId: user?.id ?? null,
      fulfillmentType: fulfillment,
      pickupBranchId:
        fulfillment === "PICKUP" ? pickupBranchId.trim() || null : null,
      paymentMethod,
      promoCode:
        appliedDiscount?.kind === "promo" ? appliedDiscount.code : null,
      loyaltyRedemptionCode:
        appliedDiscount?.kind === "loyalty" ? appliedDiscount.code : null,
      applyStoreCredit: applyStoreCredit && storeCreditApplied > 0,
      saveAddress: saveAddress && addressMode === "new" && fulfillment !== "PICKUP",
      addressLabel: locale === "ar" ? "عنوان جديد" : "Saved address",
      lines: checkoutLines.map((l) => ({
        kind: l.kind ?? "product",
        productId: l.productId,
        giftCardProductId: l.giftCardProductId,
        giftBasketId: l.giftBasketId,
        unitPrice: l.price,
        quantity: l.quantity,
        note: l.note,
        giftWrap: l.giftWrap,
        cardMessage: l.cardMessage,
        extraToppings: l.extraToppings,
        recipientName: l.recipientName,
        recipientEmail: l.recipientEmail,
        giftDelivery: l.giftDelivery,
      })),
      clientFallback: { subtotal },
    });
    setPending(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    if (user) {
      await refreshUser();
    }

    clear();
    toast.success(t("checkout.toast.orderOk"), {
      description: t("checkout.toast.orderDesc"),
    });
    const q = new URLSearchParams({ orderId: res.orderId });
    if (res.offline) q.set("offline", "1");
    if (!user) q.set("guest", "1");
    router.push(`/checkout/confirmation?${q.toString()}`);
    router.refresh();
  }

  if (!checkoutLines.length) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/40 p-8 text-center">
        <p className="text-muted-foreground">
          {lines.length > 0
            ? t("cart.drawer.giftBasketsWhatsAppOnly")
            : t("checkout.empty")}
        </p>
        <Link href="/menu" className={cn(buttonVariants(), "mt-4 inline-flex")}>
          {t("checkout.browseMenu")}
        </Link>
      </div>
    );
  }

  const showSavedPicker = ready && user && user.addresses.length > 0;

  return (
    <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {giftCardsOnly ? null : (
          <div className="rounded-2xl border border-border/50 bg-card/30 px-4 py-3 text-sm text-muted-foreground">
            {!ready ? null : user ? (
              <span>{t("checkout.account.loggedInHint")}</span>
            ) : (
              <span>{t("checkout.account.guestHint")}</span>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t("checkout.fullName")}<span className="ms-1 text-destructive">*</span></Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("checkout.phone")}<span className="ms-1 text-destructive">*</span></Label>
            <Input
              id="phone"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("checkout.phone.placeholder")}
              autoComplete="tel"
            />
          </div>
        </div>

        {giftCardsOnly ? (
          <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            {t("checkout.giftCardOnly")}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className={giftCardsOnly ? "hidden" : "space-y-2"}>
            <Label>{t("checkout.fulfillment")}</Label>
            <Select
              value={fulfillment}
              onValueChange={(v) => v && setFulfillment(v as typeof fulfillment)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {deliveryAvailable ? (
                  <>
                    <SelectItem value="DELIVERY">
                      {t("checkout.fulfillment.delivery")}
                    </SelectItem>
                    <SelectItem value="SCHEDULED">
                      {t("checkout.fulfillment.scheduled")}
                    </SelectItem>
                  </>
                ) : null}
                <SelectItem value="PICKUP">
                  {t("checkout.fulfillment.pickup")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("checkout.payment")}</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => v && setPaymentMethod(v as typeof paymentMethod)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KNET">{t("checkout.payment.knet")}</SelectItem>
                <SelectItem value="CARD">{t("checkout.payment.card")}</SelectItem>
                <SelectItem value="APPLE_PAY">
                  {t("checkout.payment.apple")}
                </SelectItem>
                <SelectItem value="GOOGLE_PAY">
                  {t("checkout.payment.google")}
                </SelectItem>
                <SelectItem value="CASH_ON_DELIVERY">
                  {t("checkout.payment.cod")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {fulfillment === "SCHEDULED" && (
          <div className="space-y-2">
            <Label htmlFor="scheduled-date">{t("checkout.scheduledDate")}<span className="ms-1 text-destructive">*</span></Label>
            <Input
              id="scheduled-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        )}

        {fulfillment === "PICKUP" && !giftCardsOnly && pickupBranches.length > 0 && (
          <div className="space-y-2">
            <Label>{t("checkout.pickup.branch")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("checkout.pickup.chooseBranch")}
            </p>
            <Select
              value={pickupBranchId}
              onValueChange={async (v) => {
                if (!v) return;
                setPickupBranchId(v);
                await setStorefrontPickupBranch(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("checkout.pickup.branch")} />
              </SelectTrigger>
              <SelectContent>
                {pickupBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {pickupBranchDisplayLabel(b.id, locale, pickupBranches)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!deliveryAvailable && (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            {t("checkout.area.notCovered")}
          </p>
        )}

        {fulfillment !== "PICKUP" && (
          <>
            {showSavedPicker && (
              <div className="space-y-3">
                <Label className="text-base">
                  {t("checkout.address.savedList")}
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {user!.addresses.map((addr) => {
                    const selected =
                      addressMode === "saved" && selectedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setAddressMode("saved");
                          setSelectedAddressId(addr.id);
                        }}
                        className={cn(
                          "flex flex-col rounded-2xl border p-4 text-start transition",
                          selected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                            : "border-border/60 bg-card/40 hover:border-primary/30"
                        )}
                      >
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          <MapPin className="size-4 shrink-0 text-primary" />
                          {addr.label}
                        </span>
                        <span className="mt-2 text-sm text-muted-foreground">
                          {[
                            addr.street && `St. ${addr.street}`,
                            addr.block && `Block ${addr.block}`,
                            addr.houseNumber && `House ${addr.houseNumber}`,
                          ]
                            .filter(Boolean)
                            .join(" · ") ||
                            addr.building ||
                            addr.street}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {DELIVERY_AREAS.find((a) => a.id === addr.deliveryAreaId)
                            ?.label ?? addr.deliveryAreaId}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("new");
                      setSelectedAddressId(null);
                      setStreet("");
                      setBlock("");
                      setCity("");
                      setHouseNumber("");
                      setFloor("");
                      setDoorNumber("");
                      setAddressNotes("");
                      setPin(null);
                      setArea(DELIVERY_AREAS[0]!.id);
                    }}
                    className={cn(
                      "flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-4 transition",
                      addressMode === "new"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                        : "border-border/60 bg-card/20 hover:border-primary/40"
                    )}
                  >
                    <Plus className="size-5 text-primary" />
                    <span className="text-sm font-medium">
                      {t("checkout.address.addNew")}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {(!user || user.addresses.length === 0 || addressMode === "new") && (
              <div className="space-y-4 rounded-2xl border border-border/50 bg-card/25 p-4 sm:p-5">
                <p className="text-sm font-medium text-foreground">
                  {t("checkout.address.sectionTitle")}
                </p>

                {/* Pin location on the map (required for delivery) */}
                {fulfillment !== "PICKUP" && (
                  <div className="space-y-2">
                    <Label>
                      {t("checkout.address.pinLocation")}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({t("checkout.optional")})
                      </span>
                    </Label>
                    <LocationPicker
                      value={pin}
                      onChange={setPin}
                      labels={{
                        instructions: t("checkout.address.pinHint"),
                        useMyLocation: t("checkout.address.useMyLocation"),
                        locating: t("checkout.address.locating"),
                        selected: t("checkout.address.pinSelected"),
                        geoError: t("checkout.address.geoError"),
                        geoDenied: t("checkout.address.geoDenied"),
                        geoUnavailable: t("checkout.address.geoUnavailable"),
                        geoTimeout: t("checkout.address.geoTimeout"),
                        geoInsecure: t("checkout.address.geoInsecure"),
                      }}
                    />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="addr-gov">
                      {t("checkout.address.governorate")}
                      <span className="ms-1 text-destructive">*</span>
                    </Label>
                    <select
                      id="addr-gov"
                      value={addrGovKey}
                      onChange={(e) => {
                        setAddrGovKey(e.target.value);
                        setAddrAreaKey("");
                      }}
                      className="h-9 w-full rounded-lg border border-border/60 bg-card px-2 text-sm"
                    >
                      {KUWAIT_GOVERNORATES.map((g) => (
                        <option key={g.key} value={g.key}>
                          {locale === "ar" ? g.nameAr : g.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-area-sel">
                      {t("account.address.area")}
                      <span className="ms-1 text-destructive">*</span>
                    </Label>
                    <select
                      id="addr-area-sel"
                      value={addrAreaKey}
                      onChange={(e) => void onAddrAreaChange(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border/60 bg-card px-2 text-sm"
                    >
                      <option value="" disabled>
                        {t("account.address.area")}…
                      </option>
                      {(addrGovernorate?.areas ?? []).map((a) => (
                        <option key={a.key} value={a.key}>
                          {locale === "ar" ? a.nameAr : a.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="block">
                      {t("checkout.address.block")}
                      <span className="ms-1 text-destructive">*</span>
                    </Label>
                    <Input
                      id="block"
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">
                      {t("checkout.address.street")}
                      <span className="ms-1 text-destructive">*</span>
                    </Label>
                    <Input
                      id="street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      autoComplete="street-address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      {t("checkout.address.avenue")}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({t("checkout.optional")})
                      </span>
                    </Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="house">
                      {t("checkout.address.houseNumber")}
                      <span className="ms-1 text-destructive">*</span>
                    </Label>
                    <Input
                      id="house"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">
                      {t("checkout.address.floor")}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({t("checkout.optional")})
                      </span>
                    </Label>
                    <Input
                      id="floor"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="door">
                      {t("checkout.address.doorNumber")}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({t("checkout.optional")})
                      </span>
                    </Label>
                    <Input
                      id="door"
                      value={doorNumber}
                      onChange={(e) => setDoorNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="addr-notes">
                      {t("checkout.address.notes")}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({t("checkout.optional")})
                      </span>
                    </Label>
                    <Textarea
                      id="addr-notes"
                      rows={2}
                      value={addressNotes}
                      onChange={(e) => setAddressNotes(e.target.value)}
                      placeholder={t("checkout.address.notes.placeholder")}
                    />
                  </div>
                  {user ? (
                    <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="size-4 rounded border-border"
                      />
                      {t("checkout.address.save")}
                    </label>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("checkout.slot")}</Label>
            <Select
              value={slot}
              onValueChange={(v) => {
                if (v) setSlot(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("checkout.slot")} />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_TIME_SLOTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Promo / loyalty code / store credit */}
        <div className="space-y-4 rounded-2xl border border-border/50 bg-card/25 p-4 sm:p-5">
          <p className="text-sm font-medium text-foreground">
            {t("checkout.discounts.title")}
          </p>

          {appliedDiscount ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <TicketPercent className="size-4 text-primary" />
                  {appliedDiscount.code}
                  {appliedDiscount.kind === "loyalty" ? (
                    <span className="text-xs text-muted-foreground">
                      −{formatKwd(appliedDiscount.discountKwd)}
                    </span>
                  ) : appliedDiscount.type === "FREE_SHIPPING" ? (
                    <span className="text-xs text-muted-foreground">
                      {t("checkout.promo.freeShipping")}
                    </span>
                  ) : appliedDiscount.subtotalDiscount +
                      appliedDiscount.deliveryDiscount >
                    0 ? (
                    <span className="text-xs text-muted-foreground">
                      −
                      {formatKwd(
                        appliedDiscount.subtotalDiscount +
                          appliedDiscount.deliveryDiscount
                      )}
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={onClearDiscount}
                  className="text-xs text-primary hover:underline"
                >
                  {t("checkout.remove")}
                </button>
              </div>
              {totalSavings > 0 ? (
                <p className="rounded-lg bg-primary/15 px-3 py-2 text-center text-sm font-medium text-primary">
                  {t("checkout.savings.badge", {
                    amount: formatKwd(totalSavings),
                  })}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder={t("checkout.promo.placeholder")}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={promoChecking || !promoInput.trim()}
                  onClick={onApplyPromo}
                >
                  {promoChecking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    t("checkout.apply")
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("checkout.loyaltyCode.hint")}
              </p>
            </div>
          )}

          {/* Store credit */}
          {user && storeCreditBalance > 0 && productsAfterLoyalty > 0 ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-3 text-sm">
              <Checkbox
                checked={applyStoreCredit}
                onCheckedChange={(v) => setApplyStoreCredit(v === true)}
                className="mt-0.5"
              />
              <span>
                <span className="flex items-center gap-2 font-medium">
                  <Gift className="size-4 text-primary" />
                  {t("checkout.storeCredit.apply", {
                    amount: formatKwd(storeCreditBalance),
                  })}
                </span>
                {applyStoreCredit && storeCreditApplied > 0 ? (
                  <span className="mt-1 block text-xs text-primary">
                    {t("checkout.storeCredit.applied", {
                      amount: formatKwd(storeCreditApplied),
                    })}
                  </span>
                ) : null}
              </span>
            </label>
          ) : null}

        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">{t("checkout.notes")}</Label>
          <Textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("checkout.notes.placeholder")}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {t("checkout.eta", { eta: formatDeliveryEta() })}
        </p>
        <Button
          type="submit"
          disabled={pending}
          className="flex w-full items-center gap-2 rounded-xl py-6 sm:w-auto sm:px-10"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("checkout.submitting")}
            </>
          ) : (
            t("checkout.submit")
          )}
        </Button>
      </div>
      <aside className="h-fit space-y-4 rounded-3xl border border-border/60 bg-card/50 p-5">
        <h2 className="font-heading text-lg">{t("checkout.summary")}</h2>
        <Separator className="bg-border/60" />
        <ul className="max-h-[320px] space-y-3 overflow-y-auto pe-1">
          {checkoutLines.map((l) => (
            <li key={cartLineKey(l)} className="flex gap-3 text-sm">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={l.image} alt="" fill className="object-cover" sizes="56px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{l.name}</p>
                <p className="text-xs text-muted-foreground">
                  ×{l.quantity} · {formatKwd(l.price)}
                </p>
                {l.giftDelivery ? (
                  <GiftDeliverySummaryLine delivery={l.giftDelivery} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        <Separator className="bg-border/60" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("checkout.subtotal")}</span>
          <span className="tabular-nums">{formatKwd(subtotal)}</span>
        </div>
        {promoSubtotalDiscount > 0 && (
          <div className="flex justify-between text-sm text-primary">
            <span>{t("checkout.promo.discount")}</span>
            <span className="tabular-nums">−{formatKwd(promoSubtotalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("checkout.delivery")}</span>
          <span className="tabular-nums">{formatKwd(feeAfterPromo)}</span>
        </div>
        {promoDeliveryDiscount > 0 && (
          <div className="flex justify-between text-xs text-primary">
            <span>{t("checkout.promo.freeShipping")}</span>
            <span className="tabular-nums">−{formatKwd(promoDeliveryDiscount)}</span>
          </div>
        )}
        {loyaltyDiscount > 0 && (
          <div className="flex justify-between text-sm text-primary">
            <span>{t("checkout.loyaltyCode.discount")}</span>
            <span className="tabular-nums">−{formatKwd(loyaltyDiscount)}</span>
          </div>
        )}
        {storeCreditApplied > 0 && (
          <div className="flex justify-between text-sm text-primary">
            <span>{t("checkout.storeCredit.discount")}</span>
            <span className="tabular-nums">−{formatKwd(storeCreditApplied)}</span>
          </div>
        )}
        {totalSavings > 0 && (
          <div className="flex justify-between rounded-lg bg-primary/10 px-2 py-1.5 text-sm font-medium text-primary">
            <span>{t("checkout.savings.total")}</span>
            <span className="tabular-nums">−{formatKwd(totalSavings)}</span>
          </div>
        )}
        <Separator className="bg-border/60" />
        <div className="flex justify-between font-heading text-lg text-primary">
          <span>{t("checkout.total")}</span>
          <span className="tabular-nums">{formatKwd(total)}</span>
        </div>
        {estimatedPointsEarned > 0 && user?.loyaltyEnabled !== false && (
          <p className="text-xs text-muted-foreground">
            {t("checkout.points.earn", { points: estimatedPointsEarned })}
          </p>
        )}
      </aside>
    </form>
  );
}
