import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/features/admin/ui/admin-login-form";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin/dashboard");
  if (user && user.provider !== "ANONYMOUS") redirect("/");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f2eee5,transparent_42%),#f8f7f3] px-5 py-8 text-stone-900">
      <Link className="text-xl font-bold tracking-tight" href="/">
        vowly
      </Link>
      <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-md content-center gap-7">
        <div className="text-center">
          <span className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-600">
            <ShieldCheck size={15} /> Закрытый раздел
          </span>
          <h1 className="m-0 text-4xl font-semibold tracking-tight">
            Панель Vowly
          </h1>
          <p className="mt-3 text-base leading-relaxed text-stone-600">
            Управление музыкальной библиотекой и текстами приглашений.
          </p>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}
