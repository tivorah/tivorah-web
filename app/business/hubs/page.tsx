import { Suspense } from "react";
import { BusinessHubs } from "../../../components/business/hubs/list";
import { LoadingState } from "../../../components/ui/loading-state";
export default function Page() {
  return <Suspense fallback={<LoadingState label="Loading your Hubs…" />}><BusinessHubs /></Suspense>;
}
