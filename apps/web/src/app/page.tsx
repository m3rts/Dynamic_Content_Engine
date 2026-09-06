import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession();
  redirect(session ? "/app" : "/login");
}
