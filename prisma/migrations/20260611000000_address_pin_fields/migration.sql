-- Pin + structured address fields for delivery and saved customer addresses.
ALTER TABLE "CustomerAddress"
  ADD COLUMN "block" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "doorNumber" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "floor" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "houseNumber" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION;

ALTER TABLE "Order"
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION;
