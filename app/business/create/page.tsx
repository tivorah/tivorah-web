import { Suspense } from "react";
import { LoadingState } from "../../../components/ui/loading-state";
import { BusinessCreate } from "../../../components/business/create";
export default function Page() {
  return (
    <div className="product-page page-shell">
      <Suspense fallback={<LoadingState label="Loading business form…" variant="form" />}>
        <BusinessCreate />
      </Suspense>
    </div>
  );
}
