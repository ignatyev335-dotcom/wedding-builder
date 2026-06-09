"use client";

import { LockKeyhole } from "lucide-react";
import { useState } from "react";

export function BrandingToggle({
  siteId,
  isPremium,
  initialValue,
}: {
  siteId: string;
  isPremium: boolean;
  initialValue: boolean;
}) {
  const [enabled, setEnabled] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    if (!isPremium || isSaving) return;
    const nextValue = !enabled;
    setIsSaving(true);
    setError("");

    const response = await fetch(`/api/wedding-sites/${siteId}/branding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeBranding: nextValue }),
    });
    const data = (await response.json()) as { error?: string };

    if (response.ok) setEnabled(nextValue);
    else setError(data.error || "Не удалось сохранить настройку.");
    setIsSaving(false);
  };

  return (
    <div className={`account-branding-toggle ${!isPremium ? "is-locked" : ""}`}>
      <span>
        {!isPremium && <LockKeyhole size={14} />}
        <strong>Скрыть подпись платформы</strong>
        <small>
          {isPremium ? "White Label включен в ваш тариф" : "Доступно на премиальном тарифе"}
        </small>
      </span>
      <button
        className={`switch ${enabled ? "is-on" : ""}`}
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={!isPremium || isSaving}
        onClick={() => void toggle()}
      >
        <i />
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
