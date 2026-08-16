"use client";

import * as React from "react";
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
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { DELIVERY_TIME_SLOTS, pickupBranchLabel, type GiftLineDelivery } from "@/lib/gift-delivery";
import type { PickupBranchOption } from "@/lib/pickup-branch";
import { KUWAIT_GOVERNORATES } from "@/lib/kuwait-areas";

type Props = {
  value: GiftLineDelivery;
  onChange: (next: GiftLineDelivery) => void;
  pickupBranches: PickupBranchOption[];
  className?: string;
};

export function GiftDeliveryFields({
  value,
  onChange,
  pickupBranches,
  className,
}: Props) {
  const { t, locale } = useI18n();
  const minDate = React.useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  function patch(partial: Partial<GiftLineDelivery>) {
    onChange({ ...value, ...partial });
  }

  // Structured receiver address — composed into the single stored string.
  const [addrGov, setAddrGov] = React.useState(KUWAIT_GOVERNORATES[0]!.key);
  const addrGovernorate = KUWAIT_GOVERNORATES.find((g) => g.key === addrGov);
  const [addrArea, setAddrArea] = React.useState("");
  const [addrBlock, setAddrBlock] = React.useState("");
  const [addrStreet, setAddrStreet] = React.useState("");
  const [addrAvenue, setAddrAvenue] = React.useState("");
  const [addrBuilding, setAddrBuilding] = React.useState("");
  const [addrFloor, setAddrFloor] = React.useState("");
  const [addrApt, setAddrApt] = React.useState("");

  function composeAddress(parts: {
    gov?: string;
    area?: string;
    block?: string;
    street?: string;
    avenue?: string;
    building?: string;
    floor?: string;
    apt?: string;
  }) {
    const gov = parts.gov ?? addrGov;
    const area = parts.area ?? addrArea;
    const g = KUWAIT_GOVERNORATES.find((x) => x.key === gov);
    const a = g?.areas.find((x) => x.key === area);
    const pieces = [
      a ? (locale === "ar" ? a.nameAr : a.nameEn) : "",
      g ? (locale === "ar" ? g.nameAr : g.nameEn) : "",
      (parts.block ?? addrBlock) &&
        `${t("checkout.address.block")} ${parts.block ?? addrBlock}`,
      (parts.street ?? addrStreet) &&
        `${t("checkout.address.street")} ${parts.street ?? addrStreet}`,
      (parts.avenue ?? addrAvenue) &&
        `${t("checkout.address.avenue")} ${parts.avenue ?? addrAvenue}`,
      (parts.building ?? addrBuilding) &&
        `${t("checkout.address.houseNumber")} ${parts.building ?? addrBuilding}`,
      (parts.floor ?? addrFloor) &&
        `${t("checkout.address.floor")} ${parts.floor ?? addrFloor}`,
      (parts.apt ?? addrApt) &&
        `${t("checkout.address.doorNumber")} ${parts.apt ?? addrApt}`,
    ].filter(Boolean);
    patch({ receiverAddress: pieces.join(", ") });
  }

  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border border-primary/25 bg-secondary/10 p-4",
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {t("gifts.delivery.sectionTitle")}
      </p>

      <div className="space-y-2">
        <Label>{t("gifts.delivery.fulfillment")}</Label>
        <Select
          value={value.fulfillmentType}
          onValueChange={(v) =>
            patch({ fulfillmentType: v as GiftLineDelivery["fulfillmentType"] })
          }
        >
          <SelectTrigger className="border-primary/20 bg-card/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DELIVERY">{t("gifts.delivery.delivery")}</SelectItem>
            <SelectItem value="PICKUP">{t("gifts.delivery.pickup")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gift-receiver-name">{t("gifts.delivery.receiverName")}<span className="ms-1 text-destructive">*</span></Label>
          <Input
            id="gift-receiver-name"
            value={value.receiverName}
            onChange={(e) => patch({ receiverName: e.target.value })}
            placeholder={t("gifts.delivery.receiverName.placeholder")}
            className="border-primary/20 bg-card/40"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gift-receiver-phone">{t("gifts.delivery.receiverPhone")}<span className="ms-1 text-destructive">*</span></Label>
          <Input
            id="gift-receiver-phone"
            type="tel"
            value={value.receiverPhone}
            onChange={(e) => patch({ receiverPhone: e.target.value })}
            placeholder={t("gifts.delivery.receiverPhone.placeholder")}
            className="border-primary/20 bg-card/40"
          />
        </div>
      </div>

      {value.fulfillmentType === "DELIVERY" ? (
        <div className="space-y-3">
          <Label>
            {t("gifts.delivery.receiverAddress")}<span className="ms-1 text-destructive">*</span>
          </Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gift-addr-gov" className="text-xs text-muted-foreground">
                {t("checkout.address.governorate")}<span className="ms-1 text-destructive">*</span>
              </Label>
              <select
                id="gift-addr-gov"
                value={addrGov}
                onChange={(e) => {
                  setAddrGov(e.target.value);
                  setAddrArea("");
                  composeAddress({ gov: e.target.value, area: "" });
                }}
                className="h-10 w-full rounded-lg border border-primary/20 bg-card/40 px-2 text-sm"
              >
                {KUWAIT_GOVERNORATES.map((g) => (
                  <option key={g.key} value={g.key}>
                    {locale === "ar" ? g.nameAr : g.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gift-addr-area" className="text-xs text-muted-foreground">
                {t("account.address.area")}<span className="ms-1 text-destructive">*</span>
              </Label>
              <select
                id="gift-addr-area"
                value={addrArea}
                onChange={(e) => {
                  setAddrArea(e.target.value);
                  composeAddress({ area: e.target.value });
                }}
                className="h-10 w-full rounded-lg border border-primary/20 bg-card/40 px-2 text-sm"
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
              <Label htmlFor="gift-addr-block" className="text-xs text-muted-foreground">
                {t("checkout.address.block")}<span className="ms-1 text-destructive">*</span>
              </Label>
              <Input
                id="gift-addr-block"
                value={addrBlock}
                onChange={(e) => {
                  setAddrBlock(e.target.value);
                  composeAddress({ block: e.target.value });
                }}
                className="border-primary/20 bg-card/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gift-addr-street" className="text-xs text-muted-foreground">
                {t("checkout.address.street")}<span className="ms-1 text-destructive">*</span>
              </Label>
              <Input
                id="gift-addr-street"
                value={addrStreet}
                onChange={(e) => {
                  setAddrStreet(e.target.value);
                  composeAddress({ street: e.target.value });
                }}
                className="border-primary/20 bg-card/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gift-addr-avenue" className="text-xs text-muted-foreground">
                {t("checkout.address.avenue")} ({t("checkout.optional")})
              </Label>
              <Input
                id="gift-addr-avenue"
                value={addrAvenue}
                onChange={(e) => {
                  setAddrAvenue(e.target.value);
                  composeAddress({ avenue: e.target.value });
                }}
                className="border-primary/20 bg-card/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gift-addr-building" className="text-xs text-muted-foreground">
                {t("checkout.address.houseNumber")}<span className="ms-1 text-destructive">*</span>
              </Label>
              <Input
                id="gift-addr-building"
                value={addrBuilding}
                onChange={(e) => {
                  setAddrBuilding(e.target.value);
                  composeAddress({ building: e.target.value });
                }}
                className="border-primary/20 bg-card/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gift-addr-floor" className="text-xs text-muted-foreground">
                {t("checkout.address.floor")} ({t("checkout.optional")})
              </Label>
              <Input
                id="gift-addr-floor"
                value={addrFloor}
                onChange={(e) => {
                  setAddrFloor(e.target.value);
                  composeAddress({ floor: e.target.value });
                }}
                className="border-primary/20 bg-card/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gift-addr-apt" className="text-xs text-muted-foreground">
                {t("checkout.address.doorNumber")} ({t("checkout.optional")})
              </Label>
              <Input
                id="gift-addr-apt"
                value={addrApt}
                onChange={(e) => {
                  setAddrApt(e.target.value);
                  composeAddress({ apt: e.target.value });
                }}
                className="border-primary/20 bg-card/40"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>{t("gifts.delivery.pickupBranch")}<span className="ms-1 text-destructive">*</span></Label>
          <Select
            value={value.pickupBranch ?? pickupBranches[0]?.id ?? ""}
            onValueChange={(v) => patch({ pickupBranch: v ?? "" })}
          >
            <SelectTrigger className="border-primary/20 bg-card/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pickupBranches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {pickupBranchLabel(b.id, locale, pickupBranches)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gift-delivery-date">{t("gifts.delivery.date")}<span className="ms-1 text-destructive">*</span></Label>
          <Input
            id="gift-delivery-date"
            type="date"
            min={minDate}
            value={value.deliveryDate}
            onChange={(e) => patch({ deliveryDate: e.target.value })}
            className="border-primary/20 bg-card/40"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("gifts.delivery.timeSlot")}<span className="ms-1 text-destructive">*</span></Label>
          <Select
            value={value.deliveryTimeSlot}
            onValueChange={(v) => patch({ deliveryTimeSlot: v ?? "" })}
          >
            <SelectTrigger className="border-primary/20 bg-card/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DELIVERY_TIME_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gift-delivery-notes">{t("gifts.delivery.notes")}</Label>
        <Textarea
          id="gift-delivery-notes"
          rows={2}
          value={value.deliveryNotes ?? ""}
          onChange={(e) => patch({ deliveryNotes: e.target.value })}
          className="border-primary/20 bg-card/40"
        />
      </div>
    </div>
  );
}
