import { translate } from "@dce/i18n";

import { getRequestLocale } from "@/lib/locale";

export default async function AppHomePage() {
  const locale = await getRequestLocale();

  return (
    <>
      <h2>{translate(locale, "home.welcome")}</h2>
      <p>{translate(locale, "home.foundationNote")}</p>
    </>
  );
}
