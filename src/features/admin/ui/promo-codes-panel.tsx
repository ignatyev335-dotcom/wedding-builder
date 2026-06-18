"use client";

import { Loader2, Plus, TicketPercent, Trash2 } from "lucide-react";
import { useState } from "react";

import type { MonetizationPlan } from "@/entities/wedding/model";

type PromoCode = {
  id: string;
  code: string;
  description: string;
  discountPercent: number;
  targetPlan: MonetizationPlan;
  maxRedemptions: number | null;
  usedCount: number;
  expiresAt: string | Date | null;
  isActive: boolean;
};

export function PromoCodesPanel({
  initialPromoCodes,
}: {
  initialPromoCodes: PromoCode[];
}) {
  const [promoCodes, setPromoCodes] = useState(initialPromoCodes);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountPercent: 15,
    targetPlan: "PREMIUM" as MonetizationPlan,
    maxRedemptions: "",
    expiresAt: "",
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const addPromoCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/promocodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          code: form.code.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
          maxRedemptions: form.maxRedemptions
            ? Number(form.maxRedemptions)
            : null,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        promoCode?: PromoCode;
      };
      if (!response.ok || !result.promoCode) {
        throw new Error(result.error || "Не удалось создать промокод.");
      }
      setPromoCodes((items) => [result.promoCode!, ...items]);
      setForm({
        code: "",
        description: "",
        discountPercent: 15,
        targetPlan: "PREMIUM",
        maxRedemptions: "",
        expiresAt: "",
      });
      setMessage("Промокод создан.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось создать промокод.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePromo = async (id: string, isActive: boolean) => {
    setBusyId(id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/promocodes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      const result = (await response.json()) as {
        error?: string;
        promoCode?: PromoCode;
      };
      if (!response.ok || !result.promoCode) {
        throw new Error(result.error || "Не удалось обновить промокод.");
      }
      setPromoCodes((items) =>
        items.map((item) => (item.id === id ? result.promoCode! : item)),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось обновить промокод.");
    } finally {
      setBusyId(null);
    }
  };

  const removePromo = async (id: string) => {
    setBusyId(id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/promocodes?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Не удалось удалить промокод.");
      setPromoCodes((items) => items.filter((item) => item.id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить промокод.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="admin-panel" id="promo">
      <header className="admin-card-heading">
        <span className="admin-card-icon">
          <TicketPercent size={21} />
        </span>
        <div>
          <small>Продажи</small>
          <h2>Промокоды и ручные акции</h2>
          <p>
            Создавайте скидки для тестовых пар, партнеров, блогеров и первых
            продаж.
          </p>
        </div>
      </header>

      <form
        className="grid gap-3 rounded-3xl bg-stone-50 p-4 md:grid-cols-2 xl:grid-cols-[1fr_1.4fr_130px_150px_150px_150px_auto]"
        onSubmit={addPromoCode}
      >
        <input
          className="admin-input"
          required
          placeholder="LOVE2026"
          value={form.code}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
            }))
          }
        />
        <input
          className="admin-input"
          placeholder="Описание"
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
        />
        <input
          className="admin-input"
          type="number"
          min={1}
          max={95}
          value={form.discountPercent}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              discountPercent: Number(event.target.value),
            }))
          }
        />
        <select
          className="admin-input"
          value={form.targetPlan}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              targetPlan: event.target.value as MonetizationPlan,
            }))
          }
        >
          <option value="FREE">FREE</option>
          <option value="PREMIUM">PREMIUM</option>
          <option value="VIP">VIP</option>
        </select>
        <input
          className="admin-input"
          type="number"
          min={1}
          placeholder="Лимит"
          value={form.maxRedemptions}
          onChange={(event) =>
            setForm((current) => ({ ...current, maxRedemptions: event.target.value }))
          }
        />
        <input
          className="admin-input"
          type="date"
          value={form.expiresAt}
          onChange={(event) =>
            setForm((current) => ({ ...current, expiresAt: event.target.value }))
          }
        />
        <button className="admin-primary-button" disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
          Создать
        </button>
      </form>

      <div className="mt-5 grid gap-3">
        {promoCodes.map((promo) => (
          <article
            className="grid gap-3 rounded-2xl border border-stone-200 p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center"
            key={promo.id}
          >
            <div>
              <strong className="text-lg">{promo.code}</strong>
              <p className="m-0 text-sm text-stone-500">
                {promo.description || "Без описания"} · {promo.discountPercent}% ·{" "}
                {promo.targetPlan}
              </p>
            </div>
            <span className="text-sm text-stone-500">
              {promo.usedCount}/{promo.maxRedemptions ?? "∞"} использований
            </span>
            <button
              className="admin-secondary-button"
              type="button"
              disabled={busyId === promo.id}
              onClick={() => void togglePromo(promo.id, !promo.isActive)}
            >
              {busyId === promo.id ? "..." : promo.isActive ? "Отключить" : "Включить"}
            </button>
            <button
              className="admin-danger-icon"
              type="button"
              disabled={busyId === promo.id}
              onClick={() => void removePromo(promo.id)}
              aria-label="Удалить промокод"
            >
              {busyId === promo.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            </button>
          </article>
        ))}
        {promoCodes.length === 0 && (
          <p className="admin-muted">Промокодов пока нет.</p>
        )}
      </div>

      {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
    </section>
  );
}
