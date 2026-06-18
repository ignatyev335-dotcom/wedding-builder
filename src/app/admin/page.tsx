import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/features/admin/ui/admin-login-form";
import { getCurrentAdmin } from "@/lib/auth/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="login-page">
      <Link className="brand" href="/">
        vowly
      </Link>
      <section className="login-shell">
        <div className="login-copy">
          <span>Закрытый контур платформы</span>
          <h1>Вход для администратора Vowly</h1>
          <p>
            Это отдельная служебная дверь владельца платформы. Клиенты входят по коду
            на странице <Link href="/login">/login</Link>, а здесь вы управляете
            каталогами, тарифами, проектами и настройками сервиса.
          </p>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}
