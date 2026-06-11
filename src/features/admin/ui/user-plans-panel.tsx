"use client";

import { Crown, Users } from "lucide-react";
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

  const changePlan = async (userId: string, plan: Plan) => {
    const response = await fetch(`/api/admin/users/${userId}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (!response.ok) return;
    setUsers((items) =>
      items.map((user) =>
        user.id === userId ? { ...user, subscriptionPlan: plan } : user,
      ),
    );
  };

  return (
    <section className="mx-auto mt-8 max-w-[1500px] rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
      <header className="mb-6 flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-stone-900 text-white">
          <Crown size={21} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
            Монетизация
          </span>
          <h2 className="m-0 text-2xl font-semibold">Тарифы пользователей</h2>
        </div>
      </header>

      <div className="grid gap-3">
        {users.map((user) => (
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
            <select
              className="min-h-11 rounded-xl border border-stone-200 bg-white px-4"
              value={user.subscriptionPlan}
              onChange={(event) =>
                void changePlan(user.id, event.target.value as Plan)
              }
            >
              <option value="FREE">Бесплатный</option>
              <option value="PREMIUM">Премиум</option>
              <option value="VIP">VIP</option>
            </select>
          </article>
        ))}
      </div>
    </section>
  );
}
