import { cookies } from "next/headers";

import { parseLocale, type Locale } from "@dce/i18n";

import { localeCookieName } from "./locale-cookie";

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return parseLocale(cookieStore.get(localeCookieName)?.value);
}

export { localeCookieName };
