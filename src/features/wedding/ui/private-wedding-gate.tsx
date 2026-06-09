"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ThemeCode } from "@/entities/wedding/model";

export function PrivateWeddingGate({
  slug,
  theme,
}: {
  slug: string;
  theme: ThemeCode;
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const unlock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsChecking(true);
    setError("");

    try {
      const response = await fetch(`/api/wedding/${encodeURIComponent(slug)}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Не удалось проверить код.");
      }

      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось проверить код.",
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <main className={`private-wedding-gate gate-theme-${theme.toLowerCase()}`}>
      <form onSubmit={unlock}>
        <span><LockKeyhole size={19} /></span>
        <small>Закрытое приглашение</small>
        <h1>Этот праздник только для своих</h1>
        <p>Введите четырехзначный код из приглашения, чтобы открыть сайт.</p>
        <label>
          <span>PIN-код</span>
          <input
            autoFocus
            required
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={pin}
            placeholder="••••"
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
          />
        </label>
        <button type="submit" disabled={pin.length !== 4 || isChecking}>
          {isChecking ? "Проверяем..." : "Открыть приглашение"}
        </button>
        {error && <strong>{error}</strong>}
      </form>
    </main>
  );
}
