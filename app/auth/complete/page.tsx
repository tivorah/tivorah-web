import { Suspense } from "react";
import { CompleteSignIn } from "../../../components/auth/complete-signin";
import { LoadingState } from "../../../components/ui/loading-state";
export default function Page() {
  return (
    <div className="product-page page-shell">
      <Suspense
        fallback={<LoadingState label="Completing sign-in…" variant="form" />}
      >
        <CompleteSignIn />
      </Suspense>
    </div>
  );
}
