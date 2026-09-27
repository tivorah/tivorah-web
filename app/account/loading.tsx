import { LoadingState } from "../../components/ui/loading-state";
export default function Loading() {
  return <div className="product-page page-shell"><LoadingState label="Loading account…" variant="form" /></div>;
}
