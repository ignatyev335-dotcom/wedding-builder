"use client";

import { ArrowLeft, ExternalLink, Monitor, Smartphone } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

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

  useEffect(() => {
    initialize(initialData);
  }, [initialData, initialize]);

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
          <button className="device-button is-active" type="button" aria-label="Мобильный вид">
            <Smartphone size={17} />
          </button>
          <button className="device-button" type="button" aria-label="Десктопный вид">
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
        <section className="constructor-preview-area">
          <div className="constructor-preview-label">
            <span>Предпросмотр</span>
            <small>390 × 844</small>
          </div>
          <div className="constructor-phone">
            <div className="constructor-phone-bar" />
            <div className="constructor-phone-screen">
              <InvitationPreview />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
