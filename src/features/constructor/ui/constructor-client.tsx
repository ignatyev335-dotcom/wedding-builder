"use client";

import dynamic from "next/dynamic";

import type { WeddingBuilderData } from "@/entities/wedding/model";
import type { ProductVisualConfig } from "@/features/platform-visual/config";

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
  visualAppearance,
  visualCopy,
}: {
  initialData: WeddingBuilderData;
  initialTab?: "content" | "styles" | "music" | "media" | "guests" | "publish";
  visualAppearance?: ProductVisualConfig["appearance"];
  visualCopy?: ProductVisualConfig["constructor"];
}) {
  return (
    <ConstructorShell
      initialData={initialData}
      initialTab={initialTab}
      visualAppearance={visualAppearance}
      visualCopy={visualCopy}
    />
  );
}
