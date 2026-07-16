"use client";

import * as React from "react";
import type { FeatureFlagKey, SocialUrlKey } from "@/lib/site-content-types";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/site-content-types";

const SocialUrlsContext = React.createContext<Record<
  SocialUrlKey,
  string
> | null>(null);

const FeatureFlagsContext = React.createContext<Record<
  FeatureFlagKey,
  boolean
> | null>(null);

export function SiteExtrasProvider({
  socialUrls,
  featureFlags,
  children,
}: {
  socialUrls: Record<SocialUrlKey, string>;
  featureFlags?: Record<FeatureFlagKey, boolean>;
  children: React.ReactNode;
}) {
  return (
    <SocialUrlsContext.Provider value={socialUrls}>
      <FeatureFlagsContext.Provider value={featureFlags ?? null}>
        {children}
      </FeatureFlagsContext.Provider>
    </SocialUrlsContext.Provider>
  );
}

export function useFeatureFlags(): Record<FeatureFlagKey, boolean> {
  return React.useContext(FeatureFlagsContext) ?? DEFAULT_FEATURE_FLAGS;
}

export function useSocialUrls(): Record<SocialUrlKey, string> | null {
  return React.useContext(SocialUrlsContext);
}
