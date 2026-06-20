import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { getProductVisualConfig } from "@/features/platform-visual/config";
import ConstructorClient from "./ConstructorClient";

export default async function ConstructorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const visualConfig = await getProductVisualConfig();

  return (
    <Suspense
      fallback={
        <p className="constructor-route-loading">Загрузка конструктора...</p>
      }
    >
      <ConstructorClient
        visualAppearance={visualConfig.appearance}
        visualCopy={visualConfig.constructor}
      />
    </Suspense>
  );
}
