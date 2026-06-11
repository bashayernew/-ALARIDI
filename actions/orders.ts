"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import {
  FulfillmentType,
  OrderStatus,
  PaymentMethod,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deliveryFeeWithFreeThreshold } from "@/lib/delivery";
import { lineExtrasTotalKwd } from "@/lib/pricing";
import { initiatePayment } from "@/lib/payment";
import { isPrismaConnectionError } from "@/lib/db-safe";
import { validatePromoForCart } from "@/lib/promotions";
import { countCustomerPromoUses } from "@/actions/promo-codes";
import { resolveGiftCardAmount } from "@/lib/gift-cards";
import { pendingGiftCardCreateData } from "@/lib/gift-card-activate";
import {
  clampStoreCreditApply,
  debitCustomerWallet,
  getCustomerStoreCredit,
} from "@/lib/wallet";
import {
  basketIsAvailable,
  computeBasketPriceKwd,
  loadGiftBasketsForCheckout,
} from "@/lib/gift-baskets";
import { giftDeliveryToOrderFields } from "@/lib/gift-delivery";
import { resolveCheckoutBranchId } from "@/lib/order-branch";
import {
  getSelectedArea,
  resolveDeliveryStorefrontBranch,
} from "@/lib/storefront-branch";
import { deliveryAreaIdFromSelection } from "@/lib/kuwait-areas";
import {
  resolveTierFromSettings,
  getLoyaltySettings,
} from "@/lib/loyalty-settings";
import {
  pointsEarnedForSubtotal,
} from "@/lib/loyalty-points";
import {
  applyLoyaltyRedemptionAtCheckout,
  validateLoyaltyRedemptionForCheckout,
} from "@/lib/loyalty-redemption";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { CartLineInput } from "@/types";

export type CheckoutPayload = {
  customerName: string;
  customerEmail?: string | null;
  phone: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  addressStreet?: string;
  addressBlock?: string;
  addressCity?: string;
  addressHouseNumber?: string;
  addressFloor?: string;
  addressDoorNumber?: string;
  deliveryArea: string;
  deliverySlot: string;
  scheduledDate?: string | null;
  customerNotes?: string;
  customerUserId?: string | null;
  fulfillmentType: "DELIVERY" | "PICKUP" | "SCHEDULED";
  /** Required when fulfillmentType is PICKUP — Branch.id */
  pickupBranchId?: string | null;
  paymentMethod: "KNET" | "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "CASH_ON_DELIVERY";
  promoCode?: string | null;
  loyaltyRedemptionCode?: string | null;
  applyStoreCredit?: boolean;
  saveAddress?: boolean;
  addressLabel?: string;
  lines: CartLineInput[];
  /** Used when DB is unreachable in development — subtotal from client cart */
  clientFallback?: { subtotal: number };
};

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      offline?: boolean;
      pointsEarned?: number;
      paymentRedirectUrl?: string;
    }
  | { ok: false; error: string };

export async function createOrder(
  payload: CheckoutPayload
): Promise<CreateOrderResult> {
  const {
    customerName,
    customerEmail,
    phone,
    address,
    latitude,
    longitude,
    addressStreet,
    addressBlock,
    addressCity,
    addressHouseNumber,
    addressFloor,
    addressDoorNumber,
    deliveryArea,
    deliverySlot,
    scheduledDate,
    customerNotes,
    customerUserId,
    fulfillmentType,
    pickupBranchId,
    paymentMethod,
    promoCode,
    loyaltyRedemptionCode,
    applyStoreCredit,
    saveAddress,
    addressLabel,
    lines,
    clientFallback,
  } = payload;

  if (!lines.length) return { ok: false, error: "Cart is empty." };
  if (!customerName?.trim() || !phone?.trim()) {
    return { ok: false, error: "Please fill in name and phone." };
  }

  const productLines = lines.filter((l) => !l.kind || l.kind === "product");
  const giftCardLines = lines.filter((l) => l.kind === "gift_card");
  const giftBasketLines = lines.filter((l) => l.kind === "gift_basket");

  const needsAddress =
    fulfillmentType !== "PICKUP" ||
    productLines.length > 0 ||
    giftBasketLines.length > 0;
  if (needsAddress && !address?.trim()) {
    return { ok: false, error: "Please fill in your delivery address." };
  }

  const productIds = [...new Set(productLines.map((l) => l.productId))];
  const giftCardProductIds = [
    ...new Set(
      giftCardLines.map((l) => l.giftCardProductId ?? l.productId)
    ),
  ];
  const giftBasketIds = [
    ...new Set(giftBasketLines.map((l) => l.giftBasketId ?? l.productId)),
  ];

  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  let giftCardProducts: Awaited<
    ReturnType<typeof prisma.giftCardProduct.findMany>
  > = [];
  let giftBaskets: Awaited<ReturnType<typeof loadGiftBasketsForCheckout>> = [];

  try {
    if (productIds.length > 0) {
      products = await prisma.product.findMany({
        where: { id: { in: productIds }, isAvailable: true },
      });
    }
    if (giftCardProductIds.length > 0) {
      giftCardProducts = await prisma.giftCardProduct.findMany({
        where: { id: { in: giftCardProductIds }, enabled: true },
      });
    }
    if (giftBasketIds.length > 0) {
      giftBaskets = await loadGiftBasketsForCheckout(giftBasketIds);
    }
  } catch (e) {
    if (
      isPrismaConnectionError(e) &&
      process.env.NODE_ENV === "development" &&
      clientFallback != null
    ) {
      return { ok: true, orderId: `local-${randomUUID()}`, offline: true };
    }
    if (isPrismaConnectionError(e)) {
      return {
        ok: false,
        error: "Service temporarily unavailable. Please try again shortly.",
      };
    }
    throw e;
  }

  if (productIds.length > 0 && products.length !== productIds.length) {
    return { ok: false, error: "Some products are no longer available." };
  }

  if (
    giftCardProductIds.length > 0 &&
    giftCardProducts.length !== giftCardProductIds.length
  ) {
    return { ok: false, error: "Some gift cards are no longer available." };
  }

  if (giftBasketIds.length > 0 && giftBaskets.length !== giftBasketIds.length) {
    return { ok: false, error: "Some gift baskets are no longer available." };
  }

  const giftBasketMap = new Map(giftBaskets.map((b) => [b.id, b]));

  // Stock check — products
  for (const line of productLines) {
    const p = products.find((x) => x.id === line.productId);
    if (p && p.stockQty != null && p.stockQty < line.quantity) {
      return {
        ok: false,
        error: `${p.name} only has ${p.stockQty} in stock.`,
      };
    }
  }

  for (const line of giftBasketLines) {
    const id = line.giftBasketId ?? line.productId;
    const basket = giftBasketMap.get(id);
    if (!basket || !basketIsAvailable(basket.items)) {
      return {
        ok: false,
        error: `${basket?.nameEn ?? "Gift basket"} is unavailable.`,
      };
    }
    for (const item of basket.items) {
      const p = item.product;
      const need = item.quantity * line.quantity;
      if (p.stockQty != null && p.stockQty < need) {
        return {
          ok: false,
          error: `${p.name} only has ${p.stockQty} in stock for this basket.`,
        };
      }
    }
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const giftCardProductMap = new Map(
    giftCardProducts.map((p) => [p.id, p])
  );

  let subtotal = 0;
  const itemData = productLines.map((line) => {
    const p = productMap.get(line.productId);
    if (!p) throw new Error("missing product");
    const unit = Number(p.price);
    const extras = lineExtrasTotalKwd(
      line.quantity,
      line.giftWrap,
      line.extraToppings
    );
    const lineTotal = unit * line.quantity + extras;
    subtotal += lineTotal;
    return {
      productId: p.id,
      quantity: line.quantity,
      note: line.note?.trim() || null,
      giftWrap: line.giftWrap,
      cardMessage: line.cardMessage?.trim() || null,
      extraToppings: line.extraToppings,
      unitPrice: unit,
      lineTotal,
      ...giftDeliveryToOrderFields(line),
    };
  });

  const giftCardItemData = giftCardLines.map((line) => {
    const id = line.giftCardProductId ?? line.productId;
    const gp = giftCardProductMap.get(id);
    if (!gp) throw new Error("missing gift card product");
    const unit = resolveGiftCardAmount(gp, line.unitPrice ?? Number(gp.price));
    if (unit == null) {
      return { ok: false as const, error: "Invalid gift card amount" };
    }
    const email = line.recipientEmail?.trim() || "";
    const phone =
      line.giftDelivery?.receiverPhone?.replace(/\D/g, "") || "";
    const name = line.recipientName?.trim() || line.giftDelivery?.receiverName?.trim() || "";
    if (!name) {
      return { ok: false as const, error: "Gift card recipient name is required" };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        ok: false as const,
        error: "A valid gift card recipient email is required",
      };
    }
    const lineTotal = unit * line.quantity;
    subtotal += lineTotal;
    return {
      ok: true as const,
      giftCardProductId: gp.id,
      quantity: line.quantity,
      unitPrice: unit,
      lineTotal,
      cardMessage: line.cardMessage?.trim() || null,
      ...giftDeliveryToOrderFields(line),
      recipientName: name,
      recipientEmail: email || null,
      recipientPhone: phone || null,
    };
  });

  const giftCardValidationError = giftCardItemData.find(
    (row) => "ok" in row && row.ok === false
  );
  if (giftCardValidationError && "error" in giftCardValidationError) {
    return { ok: false, error: giftCardValidationError.error };
  }

  const giftCardItemsResolved = giftCardItemData.filter(
    (row): row is Extract<typeof row, { ok: true }> => "ok" in row && row.ok
  );

  const giftCardItemRows = giftCardItemsResolved.flatMap((row) =>
    Array.from({ length: row.quantity }, () => ({
      giftCardProductId: row.giftCardProductId,
      quantity: 1,
      unitPrice: row.unitPrice,
      lineTotal: row.unitPrice,
      recipientName: row.recipientName,
      recipientEmail: row.recipientEmail,
      cardMessage: row.cardMessage,
      giftFulfillmentType: row.giftFulfillmentType,
      receiverPhone: row.receiverPhone,
      receiverAddress: row.receiverAddress,
      pickupBranch: row.pickupBranch,
      deliveryDate: row.deliveryDate,
      deliveryTimeSlot: row.deliveryTimeSlot,
      deliveryNotes: row.deliveryNotes,
    }))
  );

  const giftBasketItemData = giftBasketLines.map((line) => {
    const id = line.giftBasketId ?? line.productId;
    const basket = giftBasketMap.get(id);
    if (!basket) throw new Error("missing gift basket");
    const unit = computeBasketPriceKwd(basket, basket.items);
    const lineTotal = unit * line.quantity;
    subtotal += lineTotal;
    return {
      giftBasketId: basket.id,
      quantity: line.quantity,
      unitPrice: unit,
      lineTotal,
      cardMessage: line.cardMessage?.trim() || null,
      ...giftDeliveryToOrderFields(line),
      recipientName: line.recipientName?.trim() || null,
    };
  });

  const hasPhysicalProducts =
    productLines.length > 0 || giftBasketLines.length > 0;
  const deliveryBranch = await resolveDeliveryStorefrontBranch();
  const selectedArea = await getSelectedArea();

  if (
    hasPhysicalProducts &&
    fulfillmentType !== "PICKUP" &&
    !deliveryBranch
  ) {
    return {
      ok: false,
      error:
        "We don't deliver to this area yet — pickup only. Choose pickup or select a covered area.",
    };
  }

  if (fulfillmentType === "PICKUP" && hasPhysicalProducts) {
    const pid = pickupBranchId?.trim();
    if (!pid) {
      return { ok: false, error: "Please select a pickup branch." };
    }
    const pickupRow = await prisma.branch.findFirst({
      where: { id: pid, active: true },
      select: { id: true },
    });
    if (!pickupRow) {
      return { ok: false, error: "Invalid pickup branch." };
    }
  }

  const baseFee =
    fulfillmentType === "PICKUP" || !hasPhysicalProducts
      ? 0
      : deliveryFeeWithFreeThreshold(
          subtotal,
          deliveryBranch?.deliveryFeeKwd ?? 0
        );

  const orderDeliveryArea = selectedArea
    ? deliveryAreaIdFromSelection(selectedArea)
    : deliveryArea;

  // Resolve the logged-in customer (if any) for promo/loyalty/gift card.
  const customer = customerUserId
    ? await prisma.customer.findUnique({ where: { id: customerUserId } })
    : null;

  // ---- Promo ----
  let promoRow = null;
  let promoSubtotalDiscount = 0;
  let promoDeliveryDiscount = 0;
  if (promoCode) {
    const codeKey = promoCode.trim().toUpperCase();
    promoRow = codeKey
      ? await prisma.promoCode.findUnique({
          where: { code: codeKey },
          include: { products: true, categories: true },
        })
      : null;

    const promoCartLines = itemData.map((row) => {
      const p = productMap.get(row.productId);
      return {
        productId: row.productId,
        category: p!.category,
        lineTotal: row.lineTotal,
      };
    });

    const customerUseCount = promoRow
      ? await countCustomerPromoUses(customer?.id ?? null, promoRow.id)
      : 0;

    const validation = validatePromoForCart(
      promoRow,
      promoCartLines,
      baseFee,
      customer?.id ?? null,
      customerUseCount
    );
    if (!validation.ok) {
      return { ok: false, error: `Promo code: ${validation.code}` };
    }
    promoSubtotalDiscount = validation.subtotalDiscount;
    promoDeliveryDiscount = validation.deliveryDiscount;
  }

  const subtotalAfterPromo = Math.max(0, subtotal - promoSubtotalDiscount);
  const feeAfterPromo = Math.max(0, baseFee - promoDeliveryDiscount);

  const loyaltySettings = await getLoyaltySettings();
  let loyaltyDiscount = 0;
  let loyaltyWalletOverflow = 0;
  let loyaltyCodeRow: Awaited<
    ReturnType<typeof prisma.loyaltyRedemptionCode.findUnique>
  > = null;

  // Loyalty codes and store credit may only be applied against the product
  // subtotal (after any promo product discount). The delivery fee is always
  // charged in full and is never reduced by a loyalty code or gift card /
  // store credit. (Promo codes can still grant free/discounted delivery via
  // promoDeliveryDiscount above.)
  const discountableBase = subtotalAfterPromo;

  if (loyaltyRedemptionCode && customer) {
    const codeKey = loyaltyRedemptionCode.trim().toUpperCase();
    loyaltyCodeRow = codeKey
      ? await prisma.loyaltyRedemptionCode.findUnique({
          where: { code: codeKey },
        })
      : null;
    const v = validateLoyaltyRedemptionForCheckout(
      loyaltyCodeRow,
      customer.id,
      discountableBase
    );
    if (!v.ok) {
      return { ok: false, error: `Loyalty code: ${v.code}` };
    }
    loyaltyDiscount = v.discountKwd;
    loyaltyWalletOverflow = v.walletOverflowKwd;
  }

  const productsAfterLoyalty = Math.max(0, discountableBase - loyaltyDiscount);

  // ---- Store credit (wallet) ----
  let storeCreditApplied = 0;
  if (applyStoreCredit && customer) {
    const walletBalance = await getCustomerStoreCredit(prisma, customer.id);
    storeCreditApplied = clampStoreCreditApply(
      walletBalance,
      productsAfterLoyalty
    );
  }

  // Delivery fee is added back on top after product-only discounts.
  const total =
    Math.max(0, productsAfterLoyalty - storeCreditApplied) + feeAfterPromo;
  const discountAmount =
    promoSubtotalDiscount + promoDeliveryDiscount + loyaltyDiscount;

  const tier = customer
    ? resolveTierFromSettings(customer.lifetimePoints, loyaltySettings)
    : "SILVER";
  const pointsEarned =
    customer && loyaltySettings.enabled
      ? pointsEarnedForSubtotal(subtotalAfterPromo, tier, loyaltySettings)
      : 0;
  const firstOrderBonus =
    customer &&
    loyaltySettings.enabled &&
    !customer.firstOrderBonusGiven
      ? loyaltySettings.firstOrderBonusPoints
      : 0;

  const parsedScheduledDate =
    fulfillmentType === "SCHEDULED" && scheduledDate
      ? new Date(scheduledDate)
      : null;

  const orderAddress =
    address?.trim() ||
    (giftCardLines.length > 0 && !hasPhysicalProducts
      ? "Digital gift card delivery"
      : "");

  const checkoutBranchId = await resolveCheckoutBranchId({
    fulfillmentType,
    pickupBranchId:
      fulfillmentType === "PICKUP" ? pickupBranchId : null,
  });
  if (hasPhysicalProducts && !checkoutBranchId) {
    return {
      ok: false,
      error:
        fulfillmentType === "PICKUP"
          ? "Please select a pickup branch."
          : "We don't deliver to this area yet — pickup only.",
    };
  }

  // ---- Transaction: create order + side effects ----
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        branchId: checkoutBranchId,
        customerName: customerName.trim(),
        customerEmail: customerEmail?.trim() || null,
        phone: phone.trim(),
        address: orderAddress,
        latitude:
          fulfillmentType !== "PICKUP" && typeof latitude === "number"
            ? latitude
            : null,
        longitude:
          fulfillmentType !== "PICKUP" && typeof longitude === "number"
            ? longitude
            : null,
        deliveryArea: hasPhysicalProducts ? orderDeliveryArea : "digital",
        deliverySlot,
        scheduledDate: parsedScheduledDate ?? undefined,
        customerNotes: customerNotes?.trim() || null,
        customerUserId: customer?.id ?? null,
        fulfillmentType: fulfillmentType as FulfillmentType,
        paymentMethod: paymentMethod as PaymentMethod,
        subtotal,
        deliveryFee: feeAfterPromo,
        discountAmount,
        giftCardApplied: storeCreditApplied,
        loyaltyRedemptionApplied: loyaltyDiscount,
        loyaltyRedemptionCodeId: loyaltyCodeRow?.id ?? null,
        pointsRedeemed: 0,
        pointsEarned,
        total,
        promoCodeId: promoRow?.id ?? null,
        giftCardCode: null,
        status: OrderStatus.PENDING,
        items: {
          create: itemData.map((row) => ({
            productId: row.productId,
            quantity: row.quantity,
            note: row.note,
            giftWrap: row.giftWrap,
            cardMessage: row.cardMessage,
            extraToppings: row.extraToppings,
            unitPrice: row.unitPrice,
            lineTotal: row.lineTotal,
          })),
        },
        giftCardItems: {
          create: giftCardItemRows.map((row) => ({
            giftCardProductId: row.giftCardProductId,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            lineTotal: row.lineTotal,
            recipientName: row.recipientName,
            recipientEmail: row.recipientEmail,
            cardMessage: row.cardMessage,
            giftFulfillmentType: row.giftFulfillmentType,
            receiverPhone: row.receiverPhone,
            receiverAddress: row.receiverAddress,
            pickupBranch: row.pickupBranch,
            deliveryDate: row.deliveryDate,
            deliveryTimeSlot: row.deliveryTimeSlot,
            deliveryNotes: row.deliveryNotes,
          })),
        },
        giftBasketItems: {
          create: giftBasketItemData.map((row) => ({
            giftBasketId: row.giftBasketId,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            lineTotal: row.lineTotal,
            recipientName: row.recipientName,
            cardMessage: row.cardMessage,
            giftFulfillmentType: row.giftFulfillmentType,
            receiverPhone: row.receiverPhone,
            receiverAddress: row.receiverAddress,
            pickupBranch: row.pickupBranch,
            deliveryDate: row.deliveryDate,
            deliveryTimeSlot: row.deliveryTimeSlot,
            deliveryNotes: row.deliveryNotes,
          })),
        },
      },
      include: { giftCardItems: true },
    });

    for (const orderLine of created.giftCardItems) {
      const card = await tx.giftCard.create({
        data: pendingGiftCardCreateData({
          amount: Number(orderLine.unitPrice),
          recipientName: orderLine.recipientName,
          recipientEmail: orderLine.recipientEmail,
          recipientPhone: orderLine.receiverPhone,
          message: orderLine.cardMessage,
          deliveryDate: orderLine.deliveryDate,
          giftCardProductId: orderLine.giftCardProductId,
          sourceOrderId: created.id,
          purchasedByCustomerId: customer?.id ?? null,
        }),
      });

      await tx.orderGiftCardItem.update({
        where: { id: orderLine.id },
        data: { giftCardId: card.id },
      });
    }

    // Decrement stock where tracked
    for (const line of productLines) {
      const p = productMap.get(line.productId);
      if (p && p.stockQty != null) {
        await tx.product.update({
          where: { id: p.id },
          data: { stockQty: { decrement: line.quantity } },
        });
      }
    }

    for (const row of giftBasketItemData) {
      const basket = giftBasketMap.get(row.giftBasketId);
      if (!basket) continue;
      for (const item of basket.items) {
        const p = item.product;
        if (p.stockQty != null) {
          await tx.product.update({
            where: { id: p.id },
            data: {
              stockQty: { decrement: item.quantity * row.quantity },
            },
          });
        }
      }
    }

    if (promoRow) {
      await tx.promoCode.update({
        where: { id: promoRow.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    if (customer && storeCreditApplied > 0) {
      await debitCustomerWallet(tx, {
        customerId: customer.id,
        amount: storeCreditApplied,
        type: "CHECKOUT_APPLY",
        orderId: created.id,
        reason: "Applied at checkout",
      });
    }

    if (loyaltyCodeRow && customer && loyaltyDiscount + loyaltyWalletOverflow > 0) {
      await applyLoyaltyRedemptionAtCheckout(tx, {
        codeId: loyaltyCodeRow.id,
        customerId: customer.id,
        orderId: created.id,
        discountKwd: loyaltyDiscount,
        walletOverflowKwd: loyaltyWalletOverflow,
      });
    }

    if (
      customer &&
      saveAddress &&
      addressLabel &&
      fulfillmentType !== "PICKUP"
    ) {
      await tx.customerAddress.create({
        data: {
          customerId: customer.id,
          label: addressLabel,
          street: addressStreet?.trim() || orderAddress,
          building: "",
          block: addressBlock?.trim() || "",
          houseNumber: addressHouseNumber?.trim() || "",
          floor: addressFloor?.trim() || "",
          doorNumber: addressDoorNumber?.trim() || "",
          city: addressCity?.trim() || "",
          area: orderDeliveryArea,
          notes: customerNotes?.trim() || null,
          latitude: typeof latitude === "number" ? latitude : null,
          longitude: typeof longitude === "number" ? longitude : null,
        },
      });
    }

    return created;
  });

  const payRes = await initiatePayment({
    orderId: order.id,
    amountKwd: total,
    customerEmail: customerEmail ?? null,
    customerName,
    method: paymentMethod as PaymentMethod,
  });

  if (payRes.gatewayReference) {
    await prisma.order
      .update({
        where: { id: order.id },
        data: { paymentRef: payRes.gatewayReference },
      })
      .catch(() => {});
  }

  if (customerEmail) {
    sendOrderConfirmationEmail({
      to: customerEmail,
      orderId: order.id,
      totalKwd: total,
    }).catch(() => {});
  }

  revalidatePath("/admin");
  revalidatePath("/account");
  revalidatePath("/gifts");
  revalidatePath("/gifts/buy");
  revalidatePath("/admin/gift-baskets");
  return {
    ok: true,
    orderId: order.id,
    pointsEarned: pointsEarned + firstOrderBonus,
    paymentRedirectUrl: payRes.redirectUrl,
  };
}
