import { Heart } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/features/auth/ui/login-form";
import {
  adminCookieName,
  readAdminToken,
} from "@/lib/auth/admin-session";
import {
  authCookieName,
  hasValidSessionToken,
} from "@/lib/auth/session";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const authJsSession = await auth();

  if (authJsSession?.user?.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  if (authJsSession?.user?.id) {
    redirect("/dashboard");
  }

  const adminSession = readAdminToken(
    cookieStore.get(adminCookieName)?.value,
  );
  if (adminSession) {
    redirect("/admin/dashboard");
  }

  if (hasValidSessionToken(cookieStore.get(authCookieName)?.value)) {
    redirect("/dashboard");
  }

  return (
    <main className="login-page">
      <Link className="brand" href="/">
        vowly
      </Link>
      <section className="login-shell">
        <div className="login-copy">
          <span>
            <Heart size={15} />
            Ваше свадебное пространство
          </span>
          <h1>Все важное о свадьбе в одном красивом месте</h1>
          <p>
            Войдите, чтобы продолжить работу над сайтом, увидеть ответы гостей
            и управлять публикацией.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
