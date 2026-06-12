import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/lib/auth/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  redirect(admin ? "/admin/dashboard" : "/login");
}
