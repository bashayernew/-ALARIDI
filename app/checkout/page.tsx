import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getLocale } from "@/lib/i18n-server";
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
        <p className="mt-3 text-sm text-muted-foreground">
          {translate(locale, "checkout.page.note")}{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            lib/payment.ts
          </code>
          .
        </p>
      </div>
      <CheckoutForm
        storefrontAreaId={storefrontAreaId}
        storefrontAreaLabel={storefrontAreaLabel}
        deliveryAvailable={deliveryAvailable}
        branchDeliveryFeeKwd={branchDeliveryFeeKwd}
        pickupBranches={pickupBranches}
        initialPickupBranchId={defaultPickupBranchId}
      />
    </div>
  );
}
