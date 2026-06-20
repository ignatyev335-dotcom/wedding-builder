"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { WeddingBuilderData } from "@/entities/wedding/model";
import type { ProductVisualConfig } from "@/features/platform-visual/config";
import { ConstructorClient as BuilderClient } from "@/features/constructor/ui/constructor-client";
import { ConstructorFromQuiz } from "@/features/constructor/ui/constructor-from-quiz";

type ConstructorTab =
  | "content"
  | "styles"
  | "music"
  | "media"
  | "guests"
  | "publish";

export default function ConstructorClient({
  visualCopy,
}: {
  visualCopy?: ProductVisualConfig["constructor"];
}) {
  const searchParams = useSearchParams();
  const siteId = searchParams.get("siteId");
  const requestedTab = searchParams.get("tab");
  const initialTab: ConstructorTab =
    requestedTab === "guests" ? "guests" : "content";
  const [site, setSite] = useState<WeddingBuilderData | null | undefined>();

  useEffect(() => {
    if (!siteId) {
      return;
    }

    const controller = new AbortController();

    fetch(`/api/wedding-sites/${encodeURIComponent(siteId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Не удалось открыть сайт.");
        }

        return (await response.json()) as WeddingBuilderData;
      })
      .then(setSite)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setSite(null);
      });

    return () => controller.abort();
  }, [siteId]);

  if (!siteId) {
    return <ConstructorFromQuiz />;
  }

  if (site === undefined) {
    return <ConstructorLoading />;
  }

  if (site === null) {
    return (
      <main className="constructor-loading">
        <span className="brand">vowly</span>
        <p>Не удалось открыть сайт. Попробуйте перейти из личного кабинета.</p>
      </main>
    );
  }

  return <BuilderClient initialData={site} initialTab={initialTab} visualCopy={visualCopy} />;
}

function ConstructorLoading() {
  return (
    <main className="constructor-loading">
      <span className="brand">vowly</span>
      <p>Бережно открываем ваш сайт...</p>
    </main>
  );
}
