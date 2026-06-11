export const FREE_DELIVERY_THRESHOLD_KWD = 25;
export const ESTIMATED_DELIVERY_MINUTES = 25;

export type DeliveryArea = {
  id: string;
  label: string;
  feeKwd: number;
};

export const DELIVERY_AREAS: DeliveryArea[] = [
  { id: "kuwait-city", label: "Kuwait City", feeKwd: 1.5 },
  { id: "salmiya", label: "Salmiya", feeKwd: 1.5 },
  { id: "hawally", label: "Hawally", feeKwd: 1.5 },
  { id: "jabriya", label: "Jabriya", feeKwd: 2 },
  { id: "mishref", label: "Mishref", feeKwd: 2 },
  { id: "fintas", label: "Fintas / Abu Halifa", feeKwd: 2.5 },
  { id: "ahmadi", label: "Ahmadi / Fahaheel", feeKwd: 3 },
  { id: "jahra", label: "Jahra", feeKwd: 3.5 },
];

export function getDeliveryFee(subtotalKwd: number, areaId: string): number {
  const area = DELIVERY_AREAS.find((a) => a.id === areaId);
  const fee = area?.feeKwd ?? 2;
  return deliveryFeeWithFreeThreshold(subtotalKwd, fee);
}

/** Apply branch/area fee with free-delivery threshold. */
export function deliveryFeeWithFreeThreshold(
  subtotalKwd: number,
  feeKwd: number
): number {
  if (subtotalKwd >= FREE_DELIVERY_THRESHOLD_KWD) return 0;
  return feeKwd;
}

export function formatDeliveryEta(): string {
  return `~${ESTIMATED_DELIVERY_MINUTES} min`;
}
