"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  PersonalizedGuest,
  WeddingBuilderData,
} from "@/entities/wedding/model";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";
import { getDesignThemeStyle } from "@/features/constructor/lib/design-theme-style";
import { InvitationPreview } from "@/features/constructor/ui/invitation-preview";

export function PublicInvitation({
  initialData,
  personalizedGuest,
}: {
  initialData: WeddingBuilderData;
  personalizedGuest: PersonalizedGuest | null;
}) {
  const initialize = useWeddingStore((state) => state.initialize);
  const language = useWeddingStore((state) => state.language);
  const setLanguage = useWeddingStore((state) => state.setLanguage);
  const [previewData, setPreviewData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const rootRef = useRef<HTMLElement>(null);
  const initials = useMemo(
    () =>
      `${previewData.partnerOneName.trim().charAt(0).toUpperCase()} & ${previewData.partnerTwoName
        .trim()
        .charAt(0)
        .toUpperCase()}`,
    [previewData.partnerOneName, previewData.partnerTwoName],
  );
  const weddingDate = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(`${previewData.weddingDate}T12:00:00`)),
    [previewData.weddingDate],
  );

  useEffect(() => {
    initialize(previewData);
  }, [previewData, initialize]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("editorPreview")) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "VOWLY_EDITOR_DRAFT") return;

      setPreviewData((current) => ({
        ...current,
        ...event.data.draft,
      }));
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const block = target?.closest<HTMLElement>("[data-vowly-block]");
      if (!block) return;

      event.preventDefault();
      event.stopPropagation();

      rootRef.current
        ?.querySelectorAll(".vowly-editor-selected")
        .forEach((element) => element.classList.remove("vowly-editor-selected"));
      block.classList.add("vowly-editor-selected");

      window.parent.postMessage(
        {
          type: "VOWLY_EDITOR_SELECT",
          block: block.dataset.vowlyBlock,
        },
        window.location.origin,
      );
    };

    window.addEventListener("message", handleMessage);
    document.addEventListener("click", handleClick, true);
    window.parent.postMessage({ type: "VOWLY_EDITOR_READY" }, window.location.origin);

    return () => {
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsLoading(false), 1800);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isLoading || !rootRef.current) return;

    const elements = rootRef.current.querySelectorAll<HTMLElement>(
      ".wedding-hero, .wedding-welcome, .wedding-gallery, .wedding-sortable-blocks > .wedding-module",
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    elements.forEach((element) => element.classList.add("scroll-reveal"));

    if (reduceMotion) {
      elements.forEach((element) => element.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    elements.forEach((element, index) => {
      element.style.setProperty("--reveal-delay", `${Math.min(index, 4) * 45}ms`);
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isLoading]);

  return (
    <main
      className={`public-invitation preloader-theme-${previewData.currentTheme.toLowerCase()} ${
        previewData.designTheme ? "has-dynamic-theme" : ""
      }`}
      style={getDesignThemeStyle(previewData.designTheme, previewData.customFont)}
      ref={rootRef}
    >
      <div
        className={`invitation-preloader ${isLoading ? "is-visible" : "is-hidden"}`}
        aria-hidden={!isLoading}
      >
        <div className="preloader-ornament"><i /><span>◆</span><i /></div>
        <strong>{initials}</strong>
        <small>{weddingDate}</small>
      </div>
      <div className="public-language-switch" aria-label="Language">
        {(["RU", "EN", "ZH"] as const).map((code) => (
          <button
            className={language === code ? "is-active" : ""}
            type="button"
            key={code}
            onClick={() => setLanguage(code)}
          >
            {code}
          </button>
        ))}
      </div>
      <InvitationPreview personalizedGuest={personalizedGuest} />
    </main>
  );
}
