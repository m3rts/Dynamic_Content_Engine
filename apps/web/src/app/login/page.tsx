import { translate } from "@dce/i18n";

import { LocaleSwitcher, LoginForm } from "@/components/auth-ui";
import { getRequestLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const locale = await getRequestLocale();

  return (
    <div className="dce-login-page">
      <section className="dce-login-card">
        <h1 className="dce-login-heading">{translate(locale, "login.heading")}</h1>
        <LoginForm locale={locale} />
        <LocaleSwitcher locale={locale} />
      </section>
    </div>
  );
}
