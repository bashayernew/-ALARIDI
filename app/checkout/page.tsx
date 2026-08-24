import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { translate } from "@/lib/dictionary";
import {
  getPickupBranches,
  getSelectedArea,
  getSelectedPickupBranchId,
  resolveDeliveryStorefrontBranch,
} from "@/lib/storefront-branch";
import { areaDisplayLabel, deliveryAreaIdFromSelection } from "@/lib/kuwait-areas";

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const locale = await getLocale();
  const selectedArea = await getSelectedArea();
  const [branch, pickupBranches, initialPickupBranchId] = await Promise.all([
    resolveDeliveryStorefrontBranch(),
    getPickupBranches(),
    getSelectedPickupBranchId(),
  ]);
  const storefrontAreaLabel = selectedArea
    ? areaDisplayLabel(selectedArea, locale)
    : null;
  const storefrontAreaId = selectedArea
    ? deliveryAreaIdFromSelection(selectedArea)
    : null;
  const deliveryAvailable = Boolean(branch);
  const branchDeliveryFeeKwd = branch?.deliveryFeeKwd ?? null;
  let branchStoreStatus = "OPEN";
  if (branch?.branchId) {
    try {
      const row = await prisma.branch.findUnique({
        where: { id: branch.branchId },
        select: { storeStatus: true },
      });
      branchStoreStatus = row?.storeStatus ?? "OPEN";
    } catch {
      // DB offline — assume open
    }
  }

  // Default the pickup branch to the one serving the customer's selected
  // location. Order of preference:
  //   1. An explicit pickup branch the customer already chose (cookie), but
  //      only if it's still a valid, active pickup branch.
  //   2. The branch that covers the customer's selected delivery area.
  //   3. The first available branch.
  // This guarantees the pickup dropdown shows a real, named branch tied to the
  // customer's location instead of a stale / unrelated id.
  const validCookiePickupBranchId =
    initialPickupBranchId &&
    pickupBranches.some((b) => b.id === initialPickupBranchId)
      ? initialPickupBranchId
      : null;
  const defaultPickupBranchId =
    validCookiePickupBranchId ??
    branch?.branchId ??
    pickupBranches[0]?.id ??
    null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10 max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {translate(locale, "checkout.page.kicker")}
        </p>
        <h1 className="mt-2 font-heading text-3xl sm:text-4xl">
          {translate(locale, "checkout.page.title")}
        </h1>
      </div>
      <CheckoutForm
        storefrontAreaId={storefrontAreaId}
        storefrontAreaLabel={storefrontAreaLabel}
        selectedGovernorateKey={selectedArea?.governorateKey ?? null}
        selectedAreaKey={selectedArea?.areaKey ?? null}
        deliveryAvailable={deliveryAvailable}
        branchDeliveryFeeKwd={branchDeliveryFeeKwd}
        branchStoreStatus={branchStoreStatus}
        pickupBranches={pickupBranches}
        initialPickupBranchId={defaultPickupBranchId}
      />
    </div>
  );
}
