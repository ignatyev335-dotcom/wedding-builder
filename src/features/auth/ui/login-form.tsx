"use client";

import { ArrowRight, Mail, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthProviderButtons } from "@/features/auth/ui/auth-provider-buttons";

type RequestCodeResponse = {
  channel?: "email" | "phone";
  displayValue?: string;
  devCode?: string;
  error?: string;
};

type VerifyCodeResponse = {
  redirectTo?: string;
  error?: string;
};

export function LoginForm() {
  const [identity, setIdentity] = useState("");
  const [code, setCode] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [devCode, setDevCode] = useState("");
  const [step, setStep] = useState<"identity" | "code">("identity");
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

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity }),
      });
      const payload = (await response.json()) as RequestCodeResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось отправить код.");
      }

      setDisplayValue(payload.displayValue ?? identity);
      setDevCode(payload.devCode ?? "");
      setStep("code");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось отправить код. Попробуйте еще раз.",
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
        body: JSON.stringify({ identity, code }),
      });
      const payload = (await response.json()) as VerifyCodeResponse;

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
      {step === "identity" ? (
        <form onSubmit={requestCode}>
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
          <button className="login-submit" type="submit" disabled={isLoading}>
            {isLoading ? "Отправляем код..." : "Получить код"}
            <ArrowRight size={17} />
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode}>
          <label>
            <span>Код подтверждения</span>
            <div>
              <ShieldCheck size={17} />
              <input
                required
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                placeholder="000000"
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>
          </label>
          <button className="login-submit" type="submit" disabled={isLoading || code.length !== 6}>
            {isLoading ? "Проверяем..." : "Войти в личный кабинет"}
            <ArrowRight size={17} />
          </button>
          <button
            className="login-secondary-action"
            type="button"
            disabled={isLoading}
            onClick={() => {
              setStep("identity");
              setCode("");
              setError("");
            }}
          >
            <RotateCcw size={15} />
            Изменить почту или телефон
          </button>
          <p className="login-development-code">
            Код отправлен на <strong>{displayValue}</strong>.
            {devCode ? (
              <>
                {" "}
                Для локальной проверки: <strong>{devCode}</strong>
              </>
            ) : null}
          </p>
        </form>
      )}

      {error ? <p className="login-error">{error}</p> : null}
      <AuthProviderButtons />
      <p className="login-legal">
        Продолжая, вы принимаете Пользовательское соглашение и Политику конфиденциальности.
      </p>
    </div>
  );
}
