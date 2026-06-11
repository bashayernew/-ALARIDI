"use client";

import * as React from "react";
import type { SocialUrlKey } from "@/lib/site-content-types";

const SocialUrlsContext = React.createContext<Record<
  SocialUrlKey,
  string
> | null>(null);

export function SiteExtrasProvider({
  socialUrls,
  children,
}: {
  socialUrls: Record<SocialUrlKey, string>;
  children: React.ReactNode;
}) {
  return (
    <SocialUrlsContext.Provider value={socialUrls}>
      {children}
    </SocialUrlsContext.Provider>
  );
}

export function useSocialUrls(): Record<SocialUrlKey, string> | null {
  return React.useContext(SocialUrlsContext);
}
