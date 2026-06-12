"use client";

import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { getSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { AuthProviderButtons } from "@/features/auth/ui/auth-provider-buttons";

type LoginMode = "password" | "code" | "magic";

export function LoginForm() {
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [developmentCode, setDevelopmentCode] = useState("");
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

  const finishLogin = (redirectTo?: string) => {
    window.location.assign(
      redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard",
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
        throw new Error("Не удалось войти.");
      }

      const session = await getSession();
      finishLogin(
        session?.user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Не удалось войти.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const requestCode = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as {
        error?: string;
        developmentCode?: string;
      };
      if (!response.ok) throw new Error(data.error || "Не удалось отправить код.");
      setCodeRequested(true);
      setDevelopmentCode(data.developmentCode ?? "");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось отправить код.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };
      if (!response.ok || !data.redirectTo) {
        throw new Error(data.error || "Не удалось проверить код.");
      }
      finishLogin(data.redirectTo);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось проверить код.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const requestMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        redirectTo: "/login",
      });
      if (result?.error) throw new Error(result.error);
      setCodeRequested(true);
    } catch {
      setError("Не удалось отправить ссылку. Проверьте настройки почты.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-card">
      <div className="login-tabs" role="tablist">
        <button
          className={mode === "password" ? "is-active" : ""}
          type="button"
          onClick={() => {
            setMode("password");
            setError("");
          }}
        >
          Пароль
        </button>
        <button
          className={mode === "code" ? "is-active" : ""}
          type="button"
          onClick={() => {
            setMode("code");
            setError("");
          }}
        >
          Одноразовый код
        </button>
        <button
          className={mode === "magic" ? "is-active" : ""}
          type="button"
          onClick={() => {
            setMode("magic");
            setCodeRequested(false);
            setError("");
          }}
        >
          Magic Link
        </button>
      </div>

      {mode === "password" ? (
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
            {isLoading ? "Входим..." : "Войти или создать аккаунт"}
            <ArrowRight size={17} />
          </button>
        </form>
      ) : mode === "code" ? (
        <form onSubmit={verifyCode}>
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
                onChange={(event) => {
                  setEmail(event.target.value);
                  setCodeRequested(false);
                }}
              />
            </div>
          </label>
          {codeRequested && (
            <label>
              <span>Код из письма</span>
              <div>
                <KeyRound size={17} />
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  placeholder="000000"
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
              </div>
            </label>
          )}
          {developmentCode && (
            <p className="login-development-code">
              Код для локальной проверки: <strong>{developmentCode}</strong>
            </p>
          )}
          {codeRequested ? (
            <button className="login-submit" type="submit" disabled={isLoading}>
              {isLoading ? "Проверяем..." : "Подтвердить вход"}
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              className="login-submit"
              type="button"
              disabled={isLoading || !email}
              onClick={() => void requestCode()}
            >
              {isLoading ? "Отправляем..." : "Получить код"}
              <ArrowRight size={17} />
            </button>
          )}
        </form>
      ) : (
        <form onSubmit={requestMagicLink}>
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
                onChange={(event) => {
                  setEmail(event.target.value);
                  setCodeRequested(false);
                }}
              />
            </div>
          </label>
          <button className="login-submit" type="submit" disabled={isLoading}>
            {isLoading
              ? "Отправляем..."
              : codeRequested
                ? "Ссылка отправлена"
                : "Получить ссылку для входа"}
            <ArrowRight size={17} />
          </button>
        </form>
      )}

      {error && <p className="login-error">{error}</p>}
      <AuthProviderButtons />
      <p className="login-legal">
        Продолжая, вы принимаете Пользовательское соглашение и Политику
        конфиденциальности.
      </p>
    </div>
  );
}
