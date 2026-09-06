import { describe, expect, it } from "vitest";

import { parseLocale, translate } from "./index";

describe("i18n", () => {
  it("returns English by default", () => {
    expect(translate("en", "login.heading")).toBe("Sign in");
  });

  it("returns Thai when available", () => {
    expect(translate("th", "login.heading")).toBe("เข้าสู่ระบบ");
  });

  it("falls back to English for missing Thai keys", () => {
    expect(translate("th", "app.title")).toBe("Dynamic Content Engine");
  });

  it("parses supported locales", () => {
    expect(parseLocale("th")).toBe("th");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale(undefined)).toBe("en");
  });
});
