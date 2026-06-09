"use client";

import { ArrowLeft, ExternalLink, Monitor, Smartphone } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { WeddingBuilderData } from "@/entities/wedding/model";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";
import { ConstructorSidebar } from "@/features/constructor/ui/constructor-sidebar";
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
  const previewScreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initialize(initialData);
  }, [initialData, initialize]);

  const scrollPreview = (event: React.WheelEvent<HTMLElement>) => {
    const screen = previewScreenRef.current;

    if (!screen) {
      return;
    }

    event.preventDefault();
    screen.scrollBy({
      top: event.deltaY,
      left: event.deltaX,
      behavior: "auto",
    });
  };

  return (
    <main className="constructor-shell">
      <header className="constructor-header">
        <div className="constructor-header-start">
          <Link href="/" className="icon-button" aria-label="На главную">
            <ArrowLeft size={18} />
          </Link>
          <span className="brand">vowly</span>
          <span className="save-status">Ваши изменения бережно сохранены</span>
        </div>
        <div className="constructor-header-actions">
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
            className="publish-button"
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("vowly-open-publish"))
            }
          >
            Оживить сайт <ExternalLink size={15} />
          </button>
        </div>
      </header>

      <div className="constructor-layout">
        <ConstructorSidebar initialTab={initialTab} />
        <section
          className={`constructor-preview-area preview-${previewMode}`}
          onWheel={scrollPreview}
        >
          <div className="constructor-preview-label">
            <span>
              {previewMode === "mobile" ? "Мобильный вид" : "Просмотр на компьютере"}
            </span>
            <small>{previewMode === "mobile" ? "390 × 844" : "1440 × 900"}</small>
          </div>
          <div
            className={`constructor-device constructor-${previewMode}`}
          >
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
            <div
              className="constructor-device-screen"
              ref={previewScreenRef}
            >
              <InvitationPreview />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
