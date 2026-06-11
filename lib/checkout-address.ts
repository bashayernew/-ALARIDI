import { DELIVERY_AREAS } from "@/lib/delivery";

/** Single line stored on Order.address + used for confirmations */
export function formatOrderAddressLine(
  deliveryAreaId: string,
  street: string,
  building: string,
  additionalNotes: string
): string {
  const areaLabel =
    DELIVERY_AREAS.find((a) => a.id === deliveryAreaId)?.label ?? deliveryAreaId;
  const parts: string[] = [];
  const s = street.trim();
  const b = building.trim();
  const n = additionalNotes.trim();
  if (s) parts.push(s);
  if (b) parts.push(b);
  parts.push(areaLabel);
  if (n) parts.push(n);
  return parts.join(", ");
}

export type StructuredAddress = {
  street: string;
  block: string;
  city: string;
  houseNumber: string;
  floor?: string;
  doorNumber?: string;
  additionalNotes?: string;
  /** Delivery area id used for fee/branch routing (from the area picker). */
  deliveryAreaId?: string;
};

/**
 * Compose the structured checkout address (street, block, city, house number,
 * optional floor & door) into the single line stored on Order.address and
 * shown to admins / in confirmations.
 */
export function formatStructuredAddress(input: StructuredAddress): string {
  const parts: string[] = [];
  const street = input.street.trim();
  const block = input.block.trim();
  const city = input.city.trim();
  const house = input.houseNumber.trim();
  const floor = (input.floor ?? "").trim();
  const door = (input.doorNumber ?? "").trim();
  const notes = (input.additionalNotes ?? "").trim();

  if (street) parts.push(`St. ${street}`);
  if (block) parts.push(`Block ${block}`);
  if (house) parts.push(`House ${house}`);
  if (floor) parts.push(`Floor ${floor}`);
  if (door) parts.push(`Door ${door}`);
  if (city) parts.push(city);
  if (!city && input.deliveryAreaId) {
    const areaLabel = DELIVERY_AREAS.find(
      (a) => a.id === input.deliveryAreaId
    )?.label;
    if (areaLabel) parts.push(areaLabel);
  }
  if (notes) parts.push(notes);
  return parts.join(", ");
}

/** Google Maps deep link for a pinned coordinate (driver navigation). */
export function mapsLinkForCoords(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
