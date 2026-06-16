"use client";

import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { getSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { AuthProviderButtons } from "@/features/auth/ui/auth-provider-buttons";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (
      window.location.pathname === "/login" &&
      window.location.search.includes("callbackUrl=")
    ) {
      window.history.replaceState(null, "", "/login");
    }
  }, []);

  const finishLogin = async () => {
    const session = await getSession();
    window.location.assign(
      session?.user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard",
    );
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("password", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Не удалось войти. Проверьте почту и пароль.");
      }

      await finishLogin();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось войти. Попробуйте еще раз.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-card">
      <form onSubmit={submitPassword}>
        <label>
          <span>Почта</span>
          <div>
            <Mail size={17} />
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              placeholder="hello@example.ru"
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </label>
        <label>
          <span>Пароль</span>
          <div>
            <KeyRound size={17} />
            <input
              required
              minLength={8}
              type="password"
              autoComplete="current-password"
              value={password}
              placeholder="Минимум 8 символов"
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </label>
        <button className="login-submit" type="submit" disabled={isLoading}>
          {isLoading ? "Входим..." : "Войти в личный кабинет"}
          <ArrowRight size={17} />
        </button>
      </form>

      {error && <p className="login-error">{error}</p>}
      <AuthProviderButtons />
      <p className="login-legal">
        Продолжая, вы принимаете Пользовательское соглашение и Политику
        конфиденциальности.
      </p>
    </div>
  );
}
