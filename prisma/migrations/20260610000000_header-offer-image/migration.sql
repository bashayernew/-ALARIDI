-- Add optional hero/strip image URL for header offers.
ALTER TABLE "HeaderOffer" ADD COLUMN "image" TEXT NOT NULL DEFAULT '';
