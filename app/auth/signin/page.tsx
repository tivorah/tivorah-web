import { LoadingState } from "../../../components/ui/loading-state";
import { Suspense } from "react";
import { AuthForm } from "../../../components/auth/auth-form";
export default function Page() {
  return (
    <div className="product-page page-shell">
      <Suspense fallback={<LoadingState label="Loading account form…" variant="form" />}>
        <AuthForm initialMode="signin" />
      </Suspense>
    </div>
  );
}
