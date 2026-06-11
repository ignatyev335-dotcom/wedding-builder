"use client";

import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { useState } from "react";

export function AdminLoginForm() {
  const [email, setEmail] = useState("admin@vowly.ru");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as {
        error?: string;
        role?: string;
        redirectTo?: string;
      };

      if (!response.ok || result.role !== "ADMIN") {
        throw new Error(result.error || "У этого аккаунта нет прав администратора.");
      }

      window.location.href = "/admin/dashboard";
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось выполнить вход.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className="grid gap-5 rounded-[28px] border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8"
      onSubmit={submit}
    >
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        Логин
        <span className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4">
          <Mail className="shrink-0 text-stone-400" size={18} />
          <input
            className="min-h-12 w-full bg-transparent outline-none"
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </span>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        Пароль
        <span className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4">
          <KeyRound className="shrink-0 text-stone-400" size={18} />
          <input
            className="min-h-12 w-full bg-transparent outline-none"
            required
            minLength={8}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </span>
      </label>
      {error && <p className="m-0 text-sm text-red-700">{error}</p>}
      <button
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 font-semibold text-white transition hover:bg-stone-700 disabled:cursor-wait disabled:opacity-60"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Проверяем доступ..." : "Войти в панель"}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
