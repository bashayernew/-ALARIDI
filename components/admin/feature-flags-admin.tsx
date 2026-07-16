"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { setFeatureFlag } from "@/actions/cms-admin";
import type { FeatureFlagKey } from "@/lib/site-content-types";

const FEATURES: { key: FeatureFlagKey; label: string; hint: string }[] = [
  {
    key: "giftCards",
    label: "Gift cards",
    hint: "Gift card section on /gifts and the /gifts/buy page",
  },
  {
    key: "giftBaskets",
    label: "Gift baskets",
    hint: "Ready baskets and the build-your-own basket section",
  },
  {
    key: "promotions",
    label: "Promotions",
    hint: "The /promotions page and its links in the menus",
  },
];

export function FeatureFlagsAdmin({
  initial,
}: {
  initial: Record<FeatureFlagKey, boolean>;
}) {
  const router = useRouter();
  const [flags, setFlags] = React.useState(initial);
  const [busyKey, setBusyKey] = React.useState<FeatureFlagKey | null>(null);

  async function toggle(key: FeatureFlagKey, enabled: boolean) {
    setBusyKey(key);
    try {
      await setFeatureFlag(key, enabled);
      setFlags((f) => ({ ...f, [key]: enabled }));
      toast.success(
        `${FEATURES.find((x) => x.key === key)?.label} ${enabled ? "enabled" : "disabled"}`
      );
      router.refresh();
    } catch {
      toast.error("Could not update the feature.");
    }
    setBusyKey(null);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-heading text-xl text-foreground">Store features</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Turn whole sections of the store on or off. A disabled feature is
        removed from the site entirely — its page and all links to it.
      </p>
      <ul className="mt-4 space-y-3">
        {FEATURES.map((f) => (
          <li key={f.key} className="flex items-start gap-3">
            <Checkbox
              checked={flags[f.key]}
              disabled={busyKey === f.key}
              onCheckedChange={(v) => toggle(f.key, v === true)}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-foreground">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
