"use client";

import { ArrowRight, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthProviderButtons } from "@/features/auth/ui/auth-provider-buttons";

type PasswordAuthResponse = {
  redirectTo?: string;
  error?: string;
};

type AuthMode = "login" | "register";

export function LoginForm() {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
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

  const submitPasswordAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, password, mode }),
      });
      const payload = (await response.json()) as PasswordAuthResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось войти.");
      }

      window.location.assign(payload.redirectTo ?? "/dashboard");
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
      <div className="auth-mode-tabs" aria-label="Выбор сценария входа">
        <button
          className={mode === "login" ? "is-active" : ""}
          type="button"
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Вход
        </button>
        <button
          className={mode === "register" ? "is-active" : ""}
          type="button"
          onClick={() => {
            setMode("register");
            setError("");
          }}
        >
          Регистрация
        </button>
      </div>

      <form onSubmit={submitPasswordAuth}>
        <label>
          <span>Почта или телефон</span>
          <div>
            <Mail size={17} />
            <input
              required
              type="text"
              autoComplete="email tel"
              inputMode="email"
              value={identity}
              placeholder="hello@example.ru или +7 999 123-45-67"
              onChange={(event) => setIdentity(event.target.value)}
            />
          </div>
        </label>

        <label>
          <span>Пароль</span>
          <div>
            <Lock size={17} />
            <input
              required
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              value={password}
              placeholder="Минимум 8 символов"
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </label>

        <button
          className="login-submit"
          type="submit"
          disabled={isLoading || password.length < 8}
        >
          {isLoading
            ? mode === "login"
              ? "Входим..."
              : "Создаем аккаунт..."
            : mode === "login"
              ? "Войти в личный кабинет"
              : "Создать аккаунт"}
          <ArrowRight size={17} />
        </button>
      </form>

      {mode === "register" ? (
        <p className="login-development-code">
          Аккаунт нужен, чтобы сайт не потерялся и был доступен с любого устройства.
        </p>
      ) : null}

      {error ? <p className="login-error">{error}</p> : null}
      <AuthProviderButtons />
      <p className="login-legal">
        Продолжая, вы принимаете Пользовательское соглашение и Политику конфиденциальности.
      </p>
    </div>
  );
}
