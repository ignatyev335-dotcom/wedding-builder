import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.provider === "ANONYMOUS") redirect("/login");
  if (user.role === "ADMIN") redirect("/admin/dashboard");
  redirect("/account");
}
