"use client";

import { Crown, Loader2, Trash2, Users } from "lucide-react";
import { useState } from "react";

type Plan = "FREE" | "PREMIUM" | "VIP";
type ManagedUser = {
  id: string;
  name: string | null;
  email: string | null;
  subscriptionPlan: Plan;
  sitesCount: number;
};

export function UserPlansPanel({ initialUsers }: { initialUsers: ManagedUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const changePlan = async (userId: string, plan: Plan) => {
    const previousUsers = users;
    setPendingUserId(userId);
    setMessage("");
    setUsers((items) =>
      items.map((user) =>
        user.id === userId ? { ...user, subscriptionPlan: plan } : user,
      ),
    );

    try {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Не удалось обновить тариф.");
      }
      setMessage("Тариф пользователя обновлен.");
    } catch (requestError) {
      setUsers(previousUsers);
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось обновить тариф.",
      );
    } finally {
      setPendingUserId(null);
    }
  };

  const removeUser = async (userId: string) => {
    if (!window.confirm("Удалить пользователя и все его сайты?")) return;

    setDeletingUserId(userId);
    setMessage("");
    const previousUsers = users;
    setUsers((items) => items.filter((user) => user.id !== userId));

    try {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Не удалось удалить пользователя.");
      }
      setMessage("Пользователь удален.");
    } catch (requestError) {
      setUsers(previousUsers);
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось удалить пользователя.",
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <section className="mx-auto mt-8 max-w-[1500px] rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
      <header className="mb-6 flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-stone-900 text-white">
          <Crown size={21} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
            Клиенты и доступ
          </span>
          <h2 className="m-0 text-2xl font-semibold">Тарифы пользователей</h2>
          <p className="mt-1 text-sm text-stone-500">
            Меняйте тариф вручную, выдавайте VIP и удаляйте тестовые аккаунты.
          </p>
        </div>
      </header>

      <div className="grid gap-3">
        {users.map((user) => {
          const isPending = pendingUserId === user.id;

          return (
            <article
              className="grid gap-3 rounded-2xl bg-stone-50 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
              key={user.id}
            >
              <div className="min-w-0">
                <strong className="block truncate">
                  {user.name || user.email || "Пользователь"}
                </strong>
                <small className="block truncate text-stone-500">
                  {user.email || "Без почты"} · сайтов: {user.sitesCount}
                </small>
              </div>
              <span className="flex items-center gap-2 text-sm text-stone-500">
                <Users size={15} /> {user.subscriptionPlan}
              </span>
              <div className="flex items-center gap-3">
                {isPending && <Loader2 className="animate-spin text-stone-400" size={16} />}
                <select
                  className="min-h-11 rounded-xl border border-stone-200 bg-white px-4 disabled:cursor-wait disabled:opacity-60"
                  value={user.subscriptionPlan}
                  disabled={isPending}
                  onChange={(event) =>
                    void changePlan(user.id, event.target.value as Plan)
                  }
                >
                  <option value="FREE">Бесплатный</option>
                  <option value="PREMIUM">Премиум</option>
                  <option value="VIP">VIP</option>
                </select>
                <button
                  className="admin-danger-icon"
                  type="button"
                  disabled={deletingUserId === user.id}
                  onClick={() => void removeUser(user.id)}
                  aria-label="Удалить пользователя"
                >
                  {deletingUserId === user.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
    </section>
  );
}
