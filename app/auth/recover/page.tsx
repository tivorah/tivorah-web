import { AuthForm } from "../../../components/auth/auth-form";
import { loadSocialProviders } from "../../../lib/auth/auth-page";

export default async function Page() {
  const providers = await loadSocialProviders();
  return (
    <div className="product-page page-shell">
      <AuthForm initialMode="recover" initialProviders={providers} />
    </div>
  );
}
