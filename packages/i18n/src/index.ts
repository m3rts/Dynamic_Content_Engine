import { enMessages, type MessageKey } from "./messages/en";
import { thMessages } from "./messages/th";

export type Locale = "en" | "th";

export type { MessageKey };

const catalogs: Record<Locale, Partial<Record<MessageKey, string>>> = {
  en: enMessages,
  th: thMessages,
};

export function translate(locale: Locale, key: MessageKey): string {
  const localized = catalogs[locale][key];
  if (localized) {
    return localized;
  }

  const fallback = enMessages[key];
  if (fallback) {
    if (process.env.NODE_ENV === "development" && locale !== "en") {
      return `[missing:${key}] ${fallback}`;
    }
    return fallback;
  }

  return key;
}

export function parseLocale(value: string | undefined): Locale {
  return value === "th" ? "th" : "en";
}
