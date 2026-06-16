"use client";

import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Monitor,
  Music2,
  Smartphone,
  Upload,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { WeddingBuilderData } from "@/entities/wedding/model";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";
import {
  ConstructorSidebar,
  type ConstructorTab,
} from "@/features/constructor/ui/constructor-sidebar";
import { InvitationPreview } from "@/features/constructor/ui/invitation-preview";

export function ConstructorShell({
  initialData,
  initialTab = "content",
}: {
  initialData: WeddingBuilderData;
  initialTab?: "content" | "styles" | "music" | "media" | "guests" | "publish";
}) {
  const initialize = useWeddingStore((state) => state.initialize);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [mobileTab, setMobileTab] = useState<ConstructorTab>(initialTab);
  const previewScreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initialize(initialData);
  }, [initialData, initialize]);

  const scrollPreview = (event: React.WheelEvent<HTMLElement>) => {
    const screen = previewScreenRef.current;

    if (!screen) return;

    event.preventDefault();
    screen.scrollBy({
      top: event.deltaY,
      left: event.deltaX,
      behavior: "auto",
    });
  };

  return (
    <main className="constructor-shell min-w-0 pb-24 lg:pb-0">
      <header className="constructor-header">
        <div className="constructor-header-start">
          <Link href="/" className="icon-button" aria-label="На главную">
            <ArrowLeft size={18} />
          </Link>
          <span className="brand">vowly</span>
          <span className="save-status">Изменения сохраняются автоматически</span>
        </div>
        <div className="constructor-header-actions hidden lg:flex">
          <button
            className={`device-button ${previewMode === "mobile" ? "is-active" : ""}`}
            type="button"
            aria-label="Мобильный вид"
            aria-pressed={previewMode === "mobile"}
            onClick={() => setPreviewMode("mobile")}
          >
            <Smartphone size={17} />
          </button>
          <button
            className={`device-button ${previewMode === "desktop" ? "is-active" : ""}`}
            type="button"
            aria-label="Десктопный вид"
            aria-pressed={previewMode === "desktop"}
            onClick={() => setPreviewMode("desktop")}
          >
            <Monitor size={17} />
          </button>
          <button
            className="publish-button flex-shrink-0 whitespace-nowrap"
            type="button"
            onClick={() => window.dispatchEvent(new Event("vowly-open-publish"))}
          >
            Оживить сайт <ExternalLink size={15} />
          </button>
        </div>
      </header>

      <div className="constructor-layout">
        <div className="hidden min-h-0 w-full lg:block">
          <ConstructorSidebar initialTab={initialTab} />
        </div>
        <div className="block min-h-0 w-full pb-24 lg:hidden">
          <ConstructorSidebar
            activeTab={mobileTab}
            onTabChange={setMobileTab}
            hideTabs
          />
        </div>
        <section
          className={`constructor-preview-area hidden lg:flex preview-${previewMode}`}
          onWheel={scrollPreview}
        >
          <div className="constructor-preview-label">
            <span>
              {previewMode === "mobile" ? "Мобильный вид" : "Просмотр на компьютере"}
            </span>
            <small>{previewMode === "mobile" ? "390 × 844" : "1440 × 900"}</small>
          </div>
          <div className={`constructor-device constructor-${previewMode}`}>
            {previewMode === "mobile" ? (
              <div className="constructor-phone-bar" />
            ) : (
              <div className="constructor-browser-bar">
                <i />
                <i />
                <i />
                <span>vowly.ru/wedding</span>
              </div>
            )}
            <div className="constructor-device-screen" ref={previewScreenRef}>
              <InvitationPreview previewMode={previewMode} />
            </div>
          </div>
        </section>
      </div>

      {initialData.slug && (
        <a
          className="fixed top-4 right-4 z-50 rounded-full border bg-white/80 px-4 py-1.5 text-sm shadow-sm backdrop-blur transition-opacity hover:bg-white lg:hidden"
          href={`/wedding/${initialData.slug}`}
          target="_blank"
          rel="noreferrer"
        >
          Предпросмотр
        </a>
      )}

      <nav className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-stone-200 bg-white p-2 lg:hidden">
        {([
          ["content", "Настройки", FileText],
          ["music", "Музыка", Music2],
          ["guests", "Гости", UsersRound],
          ["publish", "Тарифы", Upload],
        ] as const).map(([tab, label, Icon]) => (
          <button
            className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs ${
              mobileTab === tab ? "bg-stone-100 text-stone-900" : "text-stone-500"
            }`}
            type="button"
            key={tab}
            onClick={() => setMobileTab(tab)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
