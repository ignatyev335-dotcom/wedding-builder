import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.provider === "ANONYMOUS") redirect("/login");
  redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/account");
}
