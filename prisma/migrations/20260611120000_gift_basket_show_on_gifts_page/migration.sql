-- Flag controlling whether a gift basket is featured on the public Gifts page (max two shown).
ALTER TABLE "GiftBasket"
  ADD COLUMN "showOnGiftsPage" BOOLEAN NOT NULL DEFAULT false;
