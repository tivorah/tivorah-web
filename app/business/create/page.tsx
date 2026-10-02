import { Suspense } from "react";
import { AccountSurfaceLoading } from "../../../components/account/surface-loading";
import { BusinessCreate } from "../../../components/business/create";
export default function Page() {
  return (
    <div className="product-page page-shell">
      <Suspense fallback={<AccountSurfaceLoading embedded route="/business/create" />}>
        <BusinessCreate />
      </Suspense>
    </div>
  );
}
