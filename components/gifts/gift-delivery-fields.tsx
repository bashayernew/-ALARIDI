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
          <Label htmlFor="gift-receiver-name">{t("gifts.delivery.receiverName")}</Label>
          <Input
            id="gift-receiver-name"
            value={value.receiverName}
            onChange={(e) => patch({ receiverName: e.target.value })}
            placeholder={t("gifts.delivery.receiverName.placeholder")}
            className="border-primary/20 bg-card/40"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gift-receiver-phone">{t("gifts.delivery.receiverPhone")}</Label>
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
        <div className="space-y-2">
          <Label htmlFor="gift-receiver-address">
            {t("gifts.delivery.receiverAddress")}
          </Label>
          <Textarea
            id="gift-receiver-address"
            rows={2}
            value={value.receiverAddress ?? ""}
            onChange={(e) => patch({ receiverAddress: e.target.value })}
            placeholder={t("gifts.delivery.receiverAddress.placeholder")}
            className="border-primary/20 bg-card/40"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label>{t("gifts.delivery.pickupBranch")}</Label>
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
          <Label htmlFor="gift-delivery-date">{t("gifts.delivery.date")}</Label>
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
          <Label>{t("gifts.delivery.timeSlot")}</Label>
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
          placeholder={t("gifts.delivery.notes.placeholder")}
          className="border-primary/20 bg-card/40"
        />
      </div>
    </div>
  );
}
