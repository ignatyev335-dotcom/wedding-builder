"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  Heart,
  Images,
  Monitor,
  Music2,
  Palette,
  Smartphone,
  Upload,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { WeddingBuilderData } from "@/entities/wedding/model";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";
import {
  ConstructorSidebar,
  type ConstructorTab,
} from "@/features/constructor/ui/constructor-sidebar";
import { InvitationPreview } from "@/features/constructor/ui/invitation-preview";
import type { ProductVisualConfig } from "@/features/platform-visual/config";
import { ProductPreviewBridge } from "@/features/platform-visual/ui/product-preview-bridge";

type MobileStepTab =
  | "content"
  | "styles"
  | "media"
  | "music"
  | "guests"
  | "after"
  | "publish";

type MobileStep = {
  tab: MobileStepTab;
  label: string;
  shortLabel: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const mobileSteps: MobileStep[] = [
  {
    tab: "content",
    label: "Настройки",
    shortLabel: "Сайт",
    title: "Соберите основу сайта",
    description: "Имена, дата, место встречи, текст приглашения и нужные блоки.",
    icon: FileText,
  },
  {
    tab: "styles",
    label: "Стиль",
    shortLabel: "Стиль",
    title: "Выберите настроение",
    description: "Тема, шрифт, карточки и визуальный характер приглашения.",
    icon: Palette,
  },
  {
    tab: "media",
    label: "Фото",
    shortLabel: "Фото",
    title: "Добавьте визуальную основу",
    description: "Свои фотографии или спокойная готовая галерея без личных фото.",
    icon: Images,
  },
  {
    tab: "music",
    label: "Музыка",
    shortLabel: "Музыка",
    title: "Подберите звучание",
    description: "Фоновый трек из библиотеки или собственная композиция.",
    icon: Music2,
  },
  {
    tab: "guests",
    label: "Гости",
    shortLabel: "Гости",
    title: "Подготовьте приглашения",
    description: "Гости, персональные ссылки, язык приглашения и ответы RSVP.",
    icon: UsersRound,
  },
  {
    tab: "after",
    label: "После",
    shortLabel: "После",
    title: "Подготовьте режим благодарности",
    description: "Автопереключение после свадьбы, благодарность и ссылка на фото.",
    icon: Heart,
  },
  {
    tab: "publish",
    label: "Публикация",
    shortLabel: "Запуск",
    title: "Оживите сайт",
    description: "Проверьте ссылку, QR-код, тариф и финальный запуск для гостей.",
    icon: Upload,
  },
];

type CompletionMap = Record<MobileStepTab, boolean>;

export function ConstructorShell({
  initialData,
  initialTab = "content",
  visualAppearance,
  visualCopy,
}: {
  initialData: WeddingBuilderData;
  initialTab?: ConstructorTab;
  visualAppearance?: ProductVisualConfig["appearance"];
  visualCopy?: ProductVisualConfig["constructor"];
}) {
  const initialize = useWeddingStore((state) => state.initialize);
  const partnerOneName = useWeddingStore((state) => state.partnerOneName);
  const partnerTwoName = useWeddingStore((state) => state.partnerTwoName);
  const weddingDate = useWeddingStore((state) => state.weddingDate);
  const venueAddress = useWeddingStore((state) => state.venueAddress);
  const designTheme = useWeddingStore((state) => state.designTheme);
  const heroImageDesktop = useWeddingStore((state) => state.heroImageDesktop);
  const heroImageMobile = useWeddingStore((state) => state.heroImageMobile);
  const coverPhoto = useWeddingStore((state) => state.coverPhoto);
  const galleryPhotos = useWeddingStore((state) => state.galleryPhotos);
  const musicTrack = useWeddingStore((state) => state.musicTrack);
  const customMusicDataUrl = useWeddingStore((state) => state.customMusicDataUrl);
  const guests = useWeddingStore((state) => state.guests);
  const selectedPackage = useWeddingStore((state) => state.selectedPackage);
  const postWeddingAutoEnabled = useWeddingStore(
    (state) => state.postWeddingAutoEnabled,
  );
  const postWeddingPhotoUrl = useWeddingStore((state) => state.postWeddingPhotoUrl);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [mobileTab, setMobileTab] = useState<ConstructorTab>(initialTab);
  const previewScreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initialize(initialData);
  }, [initialData, initialize]);

  const visibleMobileSteps = useMemo(() => {
    if (!visualCopy?.sections?.length) return mobileSteps;
    const configured = visualCopy.sections
      .filter((section) => section.enabled)
      .sort((a, b) => a.order - b.order);
    const nextSteps = configured
      .map((section) => mobileSteps.find((step) => step.tab === section.id))
      .filter((step): step is MobileStep => Boolean(step));
    return nextSteps.length > 0 ? nextSteps : mobileSteps;
  }, [visualCopy]);

  const mobileStepIndex = Math.max(
    0,
    visibleMobileSteps.findIndex((step) => step.tab === mobileTab),
  );
  const currentMobileStep = visibleMobileSteps[mobileStepIndex] ?? visibleMobileSteps[0];

  const completedSteps = useMemo<CompletionMap>(
    () => ({
      content:
        Boolean(partnerOneName.trim()) &&
        Boolean(partnerTwoName.trim()) &&
        Boolean(weddingDate) &&
        Boolean(venueAddress.trim()),
      styles: Boolean(designTheme),
      media:
        Boolean(heroImageDesktop || heroImageMobile || coverPhoto) ||
        galleryPhotos.length > 0,
      music: Boolean(musicTrack || customMusicDataUrl),
      guests: guests.length > 0,
      after: postWeddingAutoEnabled || Boolean(postWeddingPhotoUrl.trim()),
      publish: selectedPackage !== "BASIC",
    }),
    [
      coverPhoto,
      customMusicDataUrl,
      designTheme,
      galleryPhotos.length,
      guests.length,
      heroImageDesktop,
      heroImageMobile,
      musicTrack,
      partnerOneName,
      partnerTwoName,
      postWeddingAutoEnabled,
      postWeddingPhotoUrl,
      selectedPackage,
      venueAddress,
      weddingDate,
    ],
  );

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

  const goNextMobileStep = () => {
    const next =
      visibleMobileSteps[
        Math.min(mobileStepIndex + 1, visibleMobileSteps.length - 1)
      ];
    setMobileTab(next.tab);
  };

  return (
    <main
      className={`constructor-shell min-w-0 pb-0 product-font-${visualAppearance?.fontScale ?? "normal"} product-radius-${visualAppearance?.radius ?? "rounded"}`}
      style={
        {
          "--product-bg": visualAppearance?.backgroundColor ?? "#f8f5ef",
          "--product-surface": visualAppearance?.surfaceColor ?? "#ffffff",
          "--product-text": visualAppearance?.textColor ?? "#20241f",
          "--product-accent": visualAppearance?.accentColor ?? "#354033",
        } as CSSProperties
      }
    >
      <ProductPreviewBridge screen="constructor" />
      <header className="constructor-header">
        <div className="constructor-header-start">
          <Link href="/" className="icon-button" aria-label="На главную">
            <ArrowLeft size={18} />
          </Link>
          <span className="brand">vowly</span>
          <span className="save-status">Изменения сохраняются автоматически</span>
        </div>

        {initialData.slug ? (
          <a
            className="constructor-header-preview lg:hidden"
            data-product-field="constructor.previewButtonText"
            href={`/wedding/${initialData.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            <Smartphone size={15} />
            {visualCopy?.previewButtonText ?? "Предпросмотр"}
          </a>
        ) : null}

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
            aria-label="Вид на компьютере"
            aria-pressed={previewMode === "desktop"}
            onClick={() => setPreviewMode("desktop")}
          >
            <Monitor size={17} />
          </button>
          <button
            className="publish-button flex-shrink-0 whitespace-nowrap"
            data-product-field="constructor.publishButtonText"
            type="button"
            onClick={() => window.dispatchEvent(new Event("vowly-open-publish"))}
          >
            {visualCopy?.publishButtonText ?? "Оживить сайт"} <ExternalLink size={15} />
          </button>
        </div>
      </header>

      <div className="constructor-layout">
        <div className="hidden min-h-0 w-full lg:block">
          <ConstructorSidebar initialTab={initialTab} />
        </div>

        <div className="block min-h-0 w-full pb-8 lg:hidden">
          <MobileAssistant
            currentStep={currentMobileStep}
            completedSteps={completedSteps}
            currentIndex={mobileStepIndex}
            steps={visibleMobileSteps}
            visualCopy={visualCopy}
            onSelectTab={setMobileTab}
            onNext={goNextMobileStep}
          />
          <ConstructorSidebar activeTab={mobileTab} onTabChange={setMobileTab} hideTabs />
        </div>

        <section
          className={`constructor-preview-area hidden lg:flex preview-${previewMode}`}
          onWheel={scrollPreview}
        >
          <div className="constructor-preview-label">
            <span>{previewMode === "mobile" ? "Мобильный вид" : "Просмотр на компьютере"}</span>
            <small>{previewMode === "mobile" ? "390 x 844" : "1440 x 900"}</small>
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

    </main>
  );
}

function MobileAssistant({
  currentStep,
  completedSteps,
  currentIndex,
  steps,
  visualCopy,
  onSelectTab,
  onNext,
}: {
  currentStep: MobileStep;
  completedSteps: CompletionMap;
  currentIndex: number;
  steps: MobileStep[];
  visualCopy?: ProductVisualConfig["constructor"];
  onSelectTab: (tab: ConstructorTab) => void;
  onNext: () => void;
}) {
  const Icon = currentStep.icon;
  const isLastStep = currentIndex === steps.length - 1;

  return (
    <section className="mobile-assistant" aria-label="Свадебный ассистент" data-product-section={currentStep.tab}>
      <div className="mobile-assistant-sticky">
        <div className="mobile-assistant-top">
          <div>
            <span>
              <WandSparkles size={14} /> <span data-product-field="constructor.assistantTitle">{visualCopy?.assistantTitle ?? "Свадебный ассистент"}</span>
            </span>
            <strong>{currentStep.title}</strong>
          </div>
          <b>
            {currentIndex + 1}/{steps.length}
          </b>
        </div>

        <div className="mobile-assistant-steps" aria-label="Быстрый переход по шагам">
          {steps.map((step, index) => {
            const done = completedSteps[step.tab];

            return (
              <button
                className={`${step.tab === currentStep.tab ? "is-active" : ""} ${done ? "is-done" : ""}`}
                type="button"
                key={step.tab}
                onClick={() => onSelectTab(step.tab)}
              >
                {done ? <CheckCircle2 size={13} /> : index + 1}
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mobile-assistant-focus">
        <span>
          <Icon size={18} />
        </span>
        <div>
          <strong>{currentStep.title}</strong>
          <small data-product-field="constructor.assistantDescription">{visualCopy?.assistantDescription ?? currentStep.description}</small>
        </div>
      </div>

      <button className="mobile-assistant-next" type="button" onClick={onNext}>
        {isLastStep ? "Остаться в публикации" : "Следующий шаг"}
        <ChevronRight size={16} />
      </button>
    </section>
  );
}
