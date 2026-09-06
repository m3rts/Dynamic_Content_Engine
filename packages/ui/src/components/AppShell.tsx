import type { Locale, MessageKey } from "@dce/i18n";
import { translate } from "@dce/i18n";
import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  key: MessageKey;
  active?: boolean;
};

export type AppShellProps = {
  locale: Locale;
  titleKey?: MessageKey;
  taglineKey?: MessageKey;
  navItems: NavItem[];
  children: ReactNode;
  localeSwitcher?: ReactNode;
};

export function AppShell({
  locale,
  titleKey = "app.title",
  taglineKey = "app.tagline",
  navItems,
  children,
  localeSwitcher,
}: AppShellProps) {
  return (
    <div className="dce-app-shell">
      <aside className="dce-nav-rail">
        <div className="dce-brand">
          <h1 className="dce-brand-title">{translate(locale, titleKey)}</h1>
          <p className="dce-brand-tagline">{translate(locale, taglineKey)}</p>
        </div>
        <nav aria-label="Primary">
          <ul className="dce-nav-list">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  className="dce-nav-link"
                  href={item.href}
                  data-active={item.active ? "true" : "false"}
                >
                  {translate(locale, item.key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {localeSwitcher}
      </aside>
      <main className="dce-main">{children}</main>
    </div>
  );
}
