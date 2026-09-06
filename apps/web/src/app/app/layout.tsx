import { redirect } from "next/navigation";

import { AppShell } from "@dce/ui";

import { LocaleSwitcher } from "@/components/auth-ui";
import { getRequestLocale } from "@/lib/locale";
import { getServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/app", key: "nav.briefs" as const, active: true },
  { href: "/app", key: "nav.concepts" as const },
  { href: "/app", key: "nav.production" as const },
  { href: "/app", key: "nav.learning" as const },
  { href: "/app", key: "nav.settings" as const },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const locale = await getRequestLocale();

  return (
    <AppShell
      locale={locale}
      navItems={navItems}
      localeSwitcher={<LocaleSwitcher locale={locale} />}
    >
      {children}
    </AppShell>
  );
}
