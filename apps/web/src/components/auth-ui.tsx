"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Locale } from "@dce/i18n";
import { translate } from "@dce/i18n";
import { Button } from "@dce/ui";

import { localeCookieName } from "@/lib/locale-cookie";

type LoginFormProps = {
  locale: Locale;
};

export function LoginForm({ locale }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitCredentials();
  }

  async function submitCredentials() {
    setError(null);

    const response = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      setError(translate(locale, "login.error"));
      return;
    }

    startTransition(() => {
      router.push("/app");
      router.refresh();
    });
  }

  return (
    <form className="dce-login-form" onSubmit={handleSubmit}>
      <div className="dce-field">
        <label className="dce-label" htmlFor="email">
          {translate(locale, "login.email")}
        </label>
        <input
          id="email"
          className="dce-input"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="dce-field">
        <label className="dce-label" htmlFor="password">
          {translate(locale, "login.password")}
        </label>
        <input
          id="password"
          className="dce-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error ? <p className="dce-error">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {translate(locale, "login.submit")}
      </Button>
    </form>
  );
}

export function LocaleSwitcher({ locale }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLocale(nextLocale: Locale) {
    document.cookie = `${localeCookieName}=${nextLocale}; Path=/; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="dce-locale-switch" aria-label="Language">
      <button
        type="button"
        data-active={locale === "en" ? "true" : "false"}
        disabled={isPending}
        onClick={() => setLocale("en")}
      >
        {translate(locale, "locale.en")}
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        data-active={locale === "th" ? "true" : "false"}
        disabled={isPending}
        onClick={() => setLocale("th")}
      >
        {translate(locale, "locale.th")}
      </button>
    </div>
  );
}
