import { pageMetadata } from "../../lib/site";
import { TermsContent } from "../../components/legal/terms-content";

export const metadata = pageMetadata("Terms of Use", "The terms that apply when using Tivorah.", "/terms");

export default function Terms() {
  return <TermsContent />;
}
