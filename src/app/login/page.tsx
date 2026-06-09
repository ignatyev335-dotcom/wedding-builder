import { Heart } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/ui/login-form";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user?.provider !== "ANONYMOUS") {
    redirect(user?.role === "ADMIN" ? "/admin/dashboard" : "/account");
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
