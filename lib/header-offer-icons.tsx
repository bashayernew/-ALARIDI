import {
  Truck,
  Sparkles,
  MapPin,
  Gift,
  Star,
  Clock,
  Heart,
  Percent,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  truck: Truck,
  sparkles: Sparkles,
  "map-pin": MapPin,
  gift: Gift,
  star: Star,
  clock: Clock,
  heart: Heart,
  percent: Percent,
};

export const HEADER_OFFER_ICON_OPTIONS = Object.keys(ICON_MAP);

export function HeaderOfferIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const key = name.trim().toLowerCase().replace(/_/g, "-");
  const Icon = ICON_MAP[key] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
