"use client";

import * as React from "react";
import type { HeaderOfferPlacement } from "@prisma/client";
import type { HeaderOfferDTO } from "@/lib/header-offers";

export type HeaderOffersByPlacement = Record<
  HeaderOfferPlacement,
  HeaderOfferDTO[]
>;

const HeaderOffersContext = React.createContext<HeaderOffersByPlacement | null>(
  null
);

export function HeaderOffersProvider({
  offers,
  children,
}: {
  offers: HeaderOffersByPlacement;
  children: React.ReactNode;
}) {
  return (
    <HeaderOffersContext.Provider value={offers}>
      {children}
    </HeaderOffersContext.Provider>
  );
}

export function useHeaderOffers(): HeaderOffersByPlacement {
  const ctx = React.useContext(HeaderOffersContext);
  if (!ctx) {
    return {
      TOP_ANNOUNCEMENT: [],
      HERO_BADGE: [],
      FEATURE_STRIP: [],
    };
  }
  return ctx;
}
