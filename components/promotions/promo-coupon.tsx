"use client";

import * as React from "react";
import { Copy, Check, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  code: string;
  /** Big value shown on the stub, e.g. "10%", "5.000 KD", "FREE". */
  bigValue: string;
  discountLabel: string;
  description?: string | null;
  minOrder?: string | null;
  endsAt?: string | null;
  appliesTo?: string | null;
  checkoutNote: string;
  labelDiscount: string;
  copyLabel: string;
  copiedLabel: string;
};

export function PromoCoupon({
  code,
  bigValue,
  discountLabel,
  description,
  minOrder,
  endsAt,
  appliesTo,
  checkoutNote,
  labelDiscount,
  copyLabel,
  copiedLabel,
}: Props) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="group relative flex overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-card/85 via-card/60 to-secondary/25 shadow-[0_18px_50px_-30px_rgba(120,80,20,0.5)] transition-colors duration-300 hover:border-primary/50">
      {/* Perforation notches (cut with the page background) */}
      <span className="absolute -top-2.5 start-[5.5rem] size-5 rounded-full bg-background" aria-hidden />
      <span className="absolute -bottom-2.5 start-[5.5rem] size-5 rounded-full bg-background" aria-hidden />

      {/* Stub */}
      <div className="relative flex w-24 shrink-0 flex-col items-center justify-center gap-3 border-e border-dashed border-primary/40 bg-primary/[0.08] px-3 py-6">
        <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-semibold uppercase tracking-[0.35em] text-primary/80">
          {labelDiscount}
        </span>
        <span className="font-heading text-2xl leading-none text-primary">
          {bigValue}
        </span>
        <Ticket className="size-4 text-primary/60" />
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-lg font-bold tracking-wider text-primary">
              {code}
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {discountLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={copy}
            aria-label={copyLabel}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              copied
                ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-400"
                : "border-primary/40 text-primary hover:bg-primary/10"
            )}
          >
            {copied ? (
              <>
                <Check className="size-3.5" /> {copiedLabel}
              </>
            ) : (
              <>
                <Copy className="size-3.5" /> {copyLabel}
              </>
            )}
          </button>
        </div>

        {description ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}

        <div className="mt-auto space-y-0.5 pt-3 text-xs text-muted-foreground">
          {appliesTo ? <p>{appliesTo}</p> : null}
          {minOrder ? <p>{minOrder}</p> : null}
          {endsAt ? <p>{endsAt}</p> : null}
        </div>

        <p className="mt-2 border-t border-dashed border-border/50 pt-2 text-[11px] text-primary/90">
          {checkoutNote}
        </p>
      </div>
    </div>
  );
}
