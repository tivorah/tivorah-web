import { Suspense } from "react";
import { BusinessAppointments } from "../../../components/business/appointments";
import { LoadingState } from "../../../components/ui/loading-state";
export default function Page() {
  return <Suspense fallback={<LoadingState label="Loading appointments…" />}><BusinessAppointments /></Suspense>;
}
