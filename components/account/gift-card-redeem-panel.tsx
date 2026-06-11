"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatKwd } from "@/lib/format";
import {
  sendGiftCardRedemptionOtp,
  verifyAndRedeemGiftCard,
} from "@/actions/gift-card-redeem";
import type { TranslationKey } from "@/lib/dictionary";

type Props = {
  onRedeemed?: () => void;
};

export function GiftCardRedeemPanel({ onRedeemed }: Props) {
  const { t } = useI18n();
  const [code, setCode] = React.useState("");
  const [channel, setChannel] = React.useState<"email" | "phone">("email");
  const [target, setTarget] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function onSendOtp() {
    if (!code.trim() || !target.trim()) {
      toast.error(t("account.wallet.redeem.error.missing"));
      return;
    }
    setPending(true);
    const res = await sendGiftCardRedemptionOtp({
      code: code.trim(),
      channel,
      target: target.trim(),
    });
    setPending(false);
    if (!res.ok) {
      toast.error(t(`account.wallet.redeem.error.${res.code}` as TranslationKey));
      return;
    }
    setOtpSent(true);
    toast.success(t("account.wallet.redeem.otpSent"));
  }

  async function onRedeem() {
    if (!otp.trim()) {
      toast.error(t("account.wallet.redeem.error.invalid_otp"));
      return;
    }
    setPending(true);
    const res = await verifyAndRedeemGiftCard({
      code: code.trim(),
      otp: otp.trim(),
      channel,
      target: target.trim(),
    });
    setPending(false);
    if (!res.ok) {
      toast.error(t(`account.wallet.redeem.error.${res.code}` as TranslationKey));
      return;
    }
    toast.success(
      t("account.wallet.redeem.success", {
        amount: formatKwd(res.creditedKwd),
      })
    );
    setCode("");
    setTarget("");
    setOtp("");
    setOtpSent(false);
    onRedeemed?.();
  }

  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-secondary/10 p-4">
      <p className="text-sm font-medium">{t("account.wallet.redeem.title")}</p>
      <p className="text-xs text-muted-foreground">
        {t("account.wallet.redeem.subtitle")}
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="gc-code">{t("account.wallet.redeem.code")}</Label>
        <Input
          id="gc-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="GC-XXXXXXXX"
          className="border-primary/20 bg-card/40 font-mono"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={channel === "email" ? "default" : "outline"}
          onClick={() => setChannel("email")}
        >
          {t("account.wallet.redeem.channelEmail")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={channel === "phone" ? "default" : "outline"}
          onClick={() => setChannel("phone")}
        >
          {t("account.wallet.redeem.channelPhone")}
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gc-target">
          {channel === "email"
            ? t("account.wallet.redeem.email")
            : t("account.wallet.redeem.phone")}
        </Label>
        <Input
          id="gc-target"
          type={channel === "email" ? "email" : "tel"}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="border-primary/20 bg-card/40"
        />
      </div>

      {!otpSent ? (
        <Button
          type="button"
          disabled={pending}
          className="gap-2"
          onClick={onSendOtp}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("account.wallet.redeem.sendOtp")}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="gc-otp">{t("account.wallet.redeem.otp")}</Label>
            <Input
              id="gc-otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="border-primary/20 bg-card/40 font-mono tracking-widest"
            />
          </div>
          <Button
            type="button"
            disabled={pending}
            className="gap-2"
            onClick={onRedeem}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wallet className="size-4" />
            )}
            {t("account.wallet.redeem.confirm")}
          </Button>
        </div>
      )}
    </div>
  );
}
