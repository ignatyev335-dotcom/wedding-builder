import { Heart } from "lucide-react";
import Link from "next/link";

import { LoginForm } from "@/features/auth/ui/login-form";

export default function LoginPage() {
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
          <h1>Всё важное о свадьбе в одном красивом месте</h1>
          <p>
            Войдите, чтобы продолжить работу над сайтом, посмотреть ответы
            гостей и управлять публикацией.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
