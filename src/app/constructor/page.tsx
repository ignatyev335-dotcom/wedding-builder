import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import ConstructorClient from "./ConstructorClient";

export default async function ConstructorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <Suspense
      fallback={
        <p className="constructor-route-loading">Загрузка конструктора...</p>
      }
    >
      <ConstructorClient />
    </Suspense>
  );
}
