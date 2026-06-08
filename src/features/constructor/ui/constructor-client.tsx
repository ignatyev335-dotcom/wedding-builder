"use client";

import dynamic from "next/dynamic";

import type { WeddingBuilderData } from "@/entities/wedding/model";

const ConstructorShell = dynamic(
  () =>
    import("@/features/constructor/ui/constructor-shell").then(
      (module) => module.ConstructorShell,
    ),
  {
    ssr: false,
    loading: () => (
      <main className="constructor-loading">
        <span className="brand">vowly</span>
        <p>Открываем конструктор...</p>
      </main>
    ),
  },
);

export function ConstructorClient({
  initialData,
  initialTab = "content",
}: {
  initialData: WeddingBuilderData;
  initialTab?: "content" | "styles" | "music" | "media" | "guests" | "publish";
}) {
  return <ConstructorShell initialData={initialData} initialTab={initialTab} />;
}
