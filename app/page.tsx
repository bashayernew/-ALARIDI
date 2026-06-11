import { Suspense } from "react";
import { HomePageInner } from "@/components/home/home-page-inner";
import { HomeSkeleton } from "@/components/home/home-skeleton";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomePageInner />
    </Suspense>
  );
}
