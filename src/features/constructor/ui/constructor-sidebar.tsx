"use client";

import {
  Check,
  Clock3,
  ChevronDown,
  FileText,
  Gift,
  GripVertical,
  Images,
  Music2,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

import type {
  AudioTrackOption,
  BuilderModule,
  CardStyleCode,
  ContentBlockCode,
  CountdownStyleCode,
  DesignThemeOption,
  InvitationTemplateOption,
  PhotoMaskCode,
} from "@/entities/wedding/model";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";
import { GuestsPanel } from "@/features/constructor/ui/guests-panel";
import { persistSiteExtras } from "@/features/constructor/lib/persist-site-extras";
import { imageToDataUrl } from "@/features/constructor/lib/image-to-data-url";
import { MediaPanel } from "@/features/constructor/ui/media-panel";
import { PackagesPanel } from "@/features/constructor/ui/packages-panel";

export type ConstructorTab =
  | "content"
  | "styles"
  | "music"
  | "media"
  | "guests"
  | "crew"
  | "publish";
type ContentSection =
  | "HERO"
  | "WISHLIST"
  | "COORDINATOR"
  | "FAQ"
  | BuilderModule;

const tabs: Array<{ id: ConstructorTab; label: string; icon: typeof FileText }> = [
  { id: "content", label: "Контент", icon: FileText },
  { id: "styles", label: "Стиль", icon: Palette },
  { id: "music", label: "Музыка", icon: Music2 },
  { id: "media", label: "Фото", icon: Images },
  { id: "guests", label: "Гости", icon: UsersRound },
  { id: "crew", label: "Команда", icon: Clock3 },
  { id: "publish", label: "Публикация", icon: Upload },
];

const moduleLabels: Record<BuilderModule, string> = {
  RSVP: "Умный опрос гостей",
  DRESS_CODE: "Пожелания по стилю",
  TIMELINE: "План дня",
  TRANSFER: "Забота о дороге",
  MAP: "Место встречи",
  COUNTDOWN: "Таймер",
};

const palettePresets = [
  {
    title: "РЁР°Р»С„РµР№ Рё Р°Р№РІРѕСЂРё",
    colors: ["#F5F0E6", "#D8D4C4", "#AEB7A1", "#74806B", "#3E4A3D"],
  },
  {
    title: "РџС‹Р»СЊРЅР°СЏ СЂРѕР·Р°",
    colors: ["#F8EDEA", "#E8CBC8", "#C99898", "#986C72", "#684B52"],
  },
  {
    title: "РЁР°РјРїР°РЅСЊ",
    colors: ["#FFF9ED", "#EEDFC3", "#D2B98B", "#A48659", "#66523A"],
  },
  {
    title: "РўРµСЂСЂР°РєРѕС‚Р°",
    colors: ["#F5E5D5", "#DDB89A", "#C17C5D", "#8E513F", "#5C3931"],
  },
  {
    title: "Р”С‹РјС‡Р°С‚Рѕ-СЃРёРЅРёР№",
    colors: ["#EEF2F3", "#CCD8DD", "#91A8B3", "#5F7783", "#344955"],
  },
  {
    title: "Р§РµСЂРЅС‹Р№ Рё Р·РѕР»РѕС‚Рѕ",
    colors: ["#F5F1E8", "#D7C6A3", "#A8894F", "#4A443B", "#171817"],
  },
] as const;

const invitationTemplateCategories = [
  { value: "all", label: "Все" },
  { value: "classic", label: "Классика" },
  { value: "warm", label: "Теплые" },
  { value: "modern", label: "Современные" },
  { value: "funny", label: "С юмором" },
  { value: "minimal", label: "Минимализм" },
] as const;

const countdownStyles: Array<{ code: CountdownStyleCode; title: string }> = [
  { code: "MINIMAL", title: "РњРёРЅРёРјР°Р»РёР·Рј" },
  { code: "TILES", title: "РљР°СЂС‚РѕС‡РєРё" },
  { code: "FLIP", title: "РўР°Р±Р»Рѕ" },
];

const photoMaskOptions: Array<{ code: PhotoMaskCode; title: string }> = [
  { code: "RECTANGLE", title: "РџСЂСЏРјРѕСѓРіРѕР»СЊРЅРёРє" },
  { code: "ARCH", title: "РђСЂРєР°" },
  { code: "OVAL", title: "РћРІР°Р»" },
];

const cardStyleOptions: Array<{
  code: CardStyleCode;
  title: string;
  description: string;
}> = [
  { code: "PLAIN", title: "РљР»Р°СЃСЃРёРєР°", description: "Р§РёСЃС‚С‹Рµ СЃРїРѕРєРѕР№РЅС‹Рµ РєР°СЂС‚РѕС‡РєРё" },
  { code: "GLASS", title: "РњР°С‚РѕРІРѕРµ СЃС‚РµРєР»Рѕ", description: "РџРѕР»СѓРїСЂРѕР·СЂР°С‡РЅРѕСЃС‚СЊ Рё blur" },
  { code: "LIQUID", title: "Liquid Glass", description: "РџСЂРѕР·СЂР°С‡РЅС‹Р№ РѕР±СЉРµРј РІ РґСѓС…Рµ Apple" },
  { code: "EDITORIAL", title: "Р–СѓСЂРЅР°Р»", description: "РљСЂСѓРїРЅР°СЏ С‚РёРїРѕРіСЂР°С„РёРєР° Рё С‚РѕРЅРєРёРµ Р»РёРЅРёРё" },
  { code: "SILK", title: "РЁРµР»Рє", description: "РњСЏРіРєРёРµ СЃРІРµС‚Р»С‹Рµ СЃР»РѕРё Рё С‚РµРЅРё" },
  { code: "MONOGRAM", title: "Р’РµРЅР·РµР»СЊ", description: "РўРѕРЅРєР°СЏ СЂР°РјРєР° СЃ Р°РєС†РµРЅС‚РѕРј" },
];

export function ConstructorSidebar({
  initialTab = "content",
  activeTab: controlledTab,
  onTabChange,
  hideTabs = false,
}: {
  initialTab?: ConstructorTab;
  activeTab?: ConstructorTab;
  onTabChange?: (tab: ConstructorTab) => void;
  hideTabs?: boolean;
}) {
  const [internalTab, setInternalTab] = useState<ConstructorTab>(initialTab);
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: ConstructorTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };
  const [openSections, setOpenSections] = useState<ContentSection[]>([
    "HERO",
    "TIMELINE",
    "DRESS_CODE",
  ]);
  const [activeInvitationTemplate, setActiveInvitationTemplate] = useState<
    string | null
  >(null);
  const [templateCategory, setTemplateCategory] = useState("all");
  const [catalogTracks, setCatalogTracks] = useState<AudioTrackOption[]>([]);
  const [catalogTemplates, setCatalogTemplates] = useState<
    InvitationTemplateOption[]
  >([]);
  const [catalogThemes, setCatalogThemes] = useState<DesignThemeOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [musicError, setMusicError] = useState("");
  const [draggedBlock, setDraggedBlock] = useState<ContentBlockCode | null>(null);
  const filteredTemplates =
    templateCategory === "all"
      ? catalogTemplates
      : catalogTemplates.filter(
          (template) => template.category === templateCategory,
        );
  const saveExtrasQuietly = () => {
    void persistSiteExtras().catch(() => undefined);
  };
  const {
    siteId,
    partnerOneName,
    partnerTwoName,
    weddingDate,
    ceremonyTime,
    venueName,
    venueAddress,
    mapLatitude,
    mapLongitude,
    designTheme,
    photoMask,
    cardStyle,
    blockOrder,
    moduleVisibility,
    musicTrack,
    musicTrackTitle,
    customMusicDataUrl,
    customMusicName,
    countdownTitle,
    countdownStyle,
    timelineEvents,
    colorPalette,
    dressMoodboard,
    faqItems,
    giftPaymentLink,
    giftQrCode,
    coordinatorName,
    coordinatorRole,
    coordinatorPhoto,
    coordinatorTelegram,
    coordinatorWhatsapp,
    coordinatorPhone,
    coordinatorMapLink,
    crewTimings,
    wishlistText,
    wishlistItems,
    noFlowersEnabled,
    noFlowersText,
    transferDescription,
    transferTime,
    transferMeetingPoint,
    invitationText,
    postWeddingMode,
    postWeddingAutoEnabled,
    postWeddingHeroImage,
    postWeddingPhotoUrl,
    postWeddingThankYouText,
    heroImageDesktop,
    heroImageMobile,
    coverPhoto,
    setNames,
    setWeddingDate,
    setCeremonyTime,
    setVenueName,
    setVenueAddress,
    setMapCoordinates,
    setDesignTheme,
    setPhotoMask,
    setCardStyle,
    reorderBlocks,
    toggleModule,
    setMusicTrack,
    setCustomMusic,
    setCountdownTitle,
    setCountdownStyle,
    addTimelineEvent,
    updateTimelineEvent,
    removeTimelineEvent,
    setPaletteColor,
    setColorPalette,
    addPaletteColor,
    removePaletteColor,
    addDressMoodboardPhotos,
    removeDressMoodboardPhoto,
    addFaqItem,
    updateFaqItem,
    removeFaqItem,
    setGiftPaymentLink,
    setGiftQrCode,
    setCoordinatorField,
    addCrewTiming,
    updateCrewTiming,
    removeCrewTiming,
    setWishlistText,
    setNoFlowersEnabled,
    setNoFlowersText,
    setTransferDescription,
    setTransferTime,
    setTransferMeetingPoint,
    addWishlistItem,
    updateWishlistItem,
    removeWishlistItem,
    setInvitationText,
    setPostWeddingMode,
    setPostWeddingAutoEnabled,
    setPostWeddingHeroImage,
    setPostWeddingPhotoUrl,
    setPostWeddingThankYouText,
  } = useWeddingStore();
  const applyInvitationTemplate = (template: InvitationTemplateOption) => {
    const firstName = partnerOneName.trim();
    const secondName = partnerTwoName.trim();
    const names = [firstName, secondName].filter(Boolean).join(" Рё ");
    setInvitationText(
      template.content
        .replaceAll("{names}", names)
        .replaceAll("{partnerOne}", firstName)
        .replaceAll("{partnerTwo}", secondName),
    );
    setActiveInvitationTemplate(template.id);
    saveExtrasQuietly();
  };

  useEffect(() => {
    let active = true;

    void fetch("/api/catalog", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р±РёР±Р»РёРѕС‚РµРєСѓ.");
        return (await response.json()) as {
          tracks: AudioTrackOption[];
          templates: InvitationTemplateOption[];
          designThemes: DesignThemeOption[];
        };
      })
      .then((catalog) => {
        if (!active) return;
        setCatalogTracks(catalog.tracks);
        setCatalogTemplates(catalog.templates);
        setCatalogThemes(catalog.designThemes);
        setCatalogError("");
      })
      .catch(() => {
        if (active) setCatalogError("Р‘РёР±Р»РёРѕС‚РµРєР° РІСЂРµРјРµРЅРЅРѕ РЅРµРґРѕСЃС‚СѓРїРЅР°.");
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const openPublish = () => {
      setInternalTab("publish");
      onTabChange?.("publish");
    };
    window.addEventListener("vowly-open-publish", openPublish);

    return () => {
      window.removeEventListener("vowly-open-publish", openPublish);
    };
  }, [onTabChange]);

  const toggleSection = (section: ContentSection) => {
    setOpenSections((sections) =>
      sections.includes(section)
        ? sections.filter((current) => current !== section)
        : [...sections, section],
    );
  };

  const uploadCustomMusic = (file?: File) => {
    if (!file) return;
    if (file.type !== "audio/mpeg" && !file.name.toLowerCase().endsWith(".mp3")) {
      setMusicError("Р’С‹Р±РµСЂРёС‚Рµ С„Р°Р№Р» РІ С„РѕСЂРјР°С‚Рµ MP3.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMusicError("Р Р°Р·РјРµСЂ MP3 РЅРµ РґРѕР»Р¶РµРЅ РїСЂРµРІС‹С€Р°С‚СЊ 5 РњР‘.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setMusicError("РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕС‡РёС‚Р°С‚СЊ Р°СѓРґРёРѕС„Р°Р№Р».");
    reader.onload = () => {
      setCustomMusic(String(reader.result), file.name);
      setMusicError("");
      window.setTimeout(saveExtrasQuietly, 0);
    };
    reader.readAsDataURL(file);
  };

  const uploadDressMoodboard = async (files: FileList | null) => {
    if (!files?.length) return;
    const available = Math.max(0, 4 - dressMoodboard.length);
    const photos = await Promise.all(
      Array.from(files)
        .slice(0, available)
        .map((file) => imageToDataUrl(file, 900)),
    );
    addDressMoodboardPhotos(photos);
    window.setTimeout(saveExtrasQuietly, 0);
  };

  const uploadSingleImage = async (
    file: File | undefined,
    setter: (value: string | null) => void,
  ) => {
    if (!file) return;
    setter(await imageToDataUrl(file, 900));
    window.setTimeout(saveExtrasQuietly, 0);
  };

  return (
    <aside
      className={`constructor-sidebar ${hideTabs ? "is-mobile-editor" : ""}`}
    >
      <nav
        className={`constructor-tabs ${hideTabs ? "hidden" : "hidden lg:flex"}`}
        aria-label="Р Р°Р·РґРµР»С‹ РєРѕРЅСЃС‚СЂСѓРєС‚РѕСЂР°"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={activeTab === id ? "is-active" : ""}
            type="button"
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="constructor-editor">
        {activeTab === "content" && (
          <>
            <EditorHeading
              eyebrow="РЎРѕРґРµСЂР¶Р°РЅРёРµ"
              title="Р Р°СЃСЃРєР°Р¶РёС‚Рµ РІР°С€Сѓ РёСЃС‚РѕСЂРёСЋ"
              description="Р’СЃРµ РёР·РјРµРЅРµРЅРёСЏ СЃСЂР°Р·Сѓ РѕС‚СЂР°Р¶Р°СЋС‚СЃСЏ РІ РїСЂРµРґРїСЂРѕСЃРјРѕС‚СЂРµ."
            />

            <section className="post-wedding-toggle">
              <div>
                <strong>Режим после свадьбы</strong>
                <small>
                  Подготовьте его заранее: сайт сам переключится в 00:00 на следующий день после свадьбы. Вручную включать в праздник ничего не придется.
                </small>
              </div>
              <button
                className={`switch ${postWeddingAutoEnabled ? "is-on" : ""}`}
                type="button"
                role="switch"
                aria-checked={postWeddingAutoEnabled}
                onClick={() => {
                  setPostWeddingAutoEnabled(!postWeddingAutoEnabled);
                  window.setTimeout(saveExtrasQuietly, 0);
                }}
              >
                <i />
              </button>
            </section>
            {(postWeddingAutoEnabled || postWeddingMode) && (
              <div className="post-wedding-settings">
                <section className="post-wedding-toggle is-soft">
                  <div>
                    <strong>Показать режим сейчас</strong>
                    <small>
                      Только для проверки или если свадьба уже прошла. Автозапуск при этом останется настроенным.
                    </small>
                  </div>
                  <button
                    className={`switch ${postWeddingMode ? "is-on" : ""}`}
                    type="button"
                    role="switch"
                    aria-checked={postWeddingMode}
                    onClick={() => {
                      setPostWeddingMode(!postWeddingMode);
                      window.setTimeout(saveExtrasQuietly, 0);
                    }}
                  >
                    <i />
                  </button>
                </section>
                <label className="constructor-field">
                  <span>Обложка после свадьбы</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      void uploadSingleImage(
                        event.target.files?.[0],
                        setPostWeddingHeroImage,
                      )
                    }
                  />
                  {postWeddingHeroImage && (
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        setPostWeddingHeroImage(null);
                        window.setTimeout(saveExtrasQuietly, 0);
                      }}
                    >
                      Убрать фото
                    </button>
                  )}
                  <small>
                    Можно поставить уже свадебный кадр: платье, букет, первый танец или общее фото.
                  </small>
                </label>
                <label className="constructor-field">
                  <span>Текст благодарности</span>
                  <textarea
                    value={postWeddingThankYouText}
                    onChange={(event) =>
                      setPostWeddingThankYouText(event.target.value)
                    }
                    onBlur={saveExtrasQuietly}
                  />
                </label>
                <label className="constructor-field post-wedding-link-field">
                  <span>Ссылка на готовые фотографии</span>
                  <input
                    type="url"
                    value={postWeddingPhotoUrl}
                    placeholder="https://disk.yandex.ru/..."
                    onChange={(event) =>
                      setPostWeddingPhotoUrl(event.target.value)
                    }
                    onBlur={saveExtrasQuietly}
                  />
                  <small>
                    Love Story останется на сайте, а эта ссылка откроет гостям готовые фотографии после свадьбы.
                  </small>
                </label>
              </div>
            )}

            <div className="content-accordion">
              <ContentAccordionHeader
                title="Р“Р»Р°РІРЅС‹Р№ Р±Р»РѕРє"
                isOpen={openSections.includes("HERO")}
                onOpen={() => toggleSection("HERO")}
              />
              {openSections.includes("HERO") && (
                <div className="accordion-body">
                  <div className="constructor-field-grid">
                    <label className="constructor-field">
                      <span>Р–РµРЅРёС…</span>
                      <input
                        value={partnerOneName}
                        placeholder="Р–РµРЅРёС…"
                        onChange={(event) =>
                          setNames(event.target.value, partnerTwoName)
                        }
                      />
                    </label>
                    <label className="constructor-field">
                      <span>РќРµРІРµСЃС‚Р°</span>
                      <input
                        value={partnerTwoName}
                        placeholder="РќРµРІРµСЃС‚Р°"
                        onChange={(event) =>
                          setNames(partnerOneName, event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <label className="constructor-field">
                    <span>Р”Р°С‚Р° СЃРІР°РґСЊР±С‹</span>
                    <input
                      type="date"
                      value={weddingDate}
                      onChange={(event) => setWeddingDate(event.target.value)}
                    />
                  </label>
                  <label className="constructor-field">
                    <span>Р’СЂРµРјСЏ РЅР°С‡Р°Р»Р°</span>
                    <input
                      type="time"
                      step={15 * 60}
                      value={ceremonyTime}
                      onChange={(event) => setCeremonyTime(event.target.value)}
                      onBlur={saveExtrasQuietly}
                    />
                  </label>
                  <label className="constructor-field invitation-copy-field">
                    <span>РўРµРєСЃС‚ РїСЂРёРіР»Р°С€РµРЅРёСЏ</span>
                    <div className="tone-chips" aria-label="Категория текста">
                      {invitationTemplateCategories.map((category) => (
                        <button
                          className={
                            templateCategory === category.value
                              ? "is-selected"
                              : ""
                          }
                          key={category.value}
                          type="button"
                          onClick={() => setTemplateCategory(category.value)}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                    <div className="tone-chips" aria-label="Шаблон текста">
                      {filteredTemplates.map((template) => (
                        <button
                          className={
                            activeInvitationTemplate === template.id
                              ? "is-selected"
                              : ""
                          }
                          key={template.id}
                          type="button"
                          onClick={() => applyInvitationTemplate(template)}
                        >
                          {template.title}
                        </button>
                      ))}
                    </div>
                    {catalogLoading && (
                      <small className="catalog-message">Р—Р°РіСЂСѓР¶Р°РµРј С€Р°Р±Р»РѕРЅС‹...</small>
                    )}
                    {!catalogLoading && catalogTemplates.length === 0 && (
                      <small className="catalog-message">
                        РЁР°Р±Р»РѕРЅС‹ РїРѕСЏРІСЏС‚СЃСЏ РїРѕСЃР»Рµ РґРѕР±Р°РІР»РµРЅРёСЏ РІ Р°РґРјРёРЅРєРµ.
                      </small>
                    )}
                    <textarea
                      value={invitationText}
                      onChange={(event) => {
                        setInvitationText(event.target.value);
                        setActiveInvitationTemplate(null);
                      }}
                      onBlur={saveExtrasQuietly}
                    />
                  </label>
                </div>
              )}
            </div>

            {!postWeddingMode && (
              <>
                <div className="editor-section-heading">
                  <span>Р‘Р»РѕРєРё СЃР°Р№С‚Р°</span>
                  <small>РџРµСЂРµС‚Р°СЃРєРёРІР°Р№С‚Рµ Р±Р»РѕРєРё Рё РјРµРЅСЏР№С‚Рµ СЃС‚СЂСѓРєС‚СѓСЂСѓ РїСЂРёРіР»Р°С€РµРЅРёСЏ</small>
                </div>

                <div className="content-accordion-list">
                  {blockOrder.map((block) => {
                if (block === "WISHLIST") {
                  return (
                    <DraggableContentBlock
                      block={block}
                      draggedBlock={draggedBlock}
                      key={block}
                      onDragEnd={() => {
                        setDraggedBlock(null);
                        window.setTimeout(saveExtrasQuietly, 0);
                      }}
                      onDragOver={(over) => {
                        if (draggedBlock && draggedBlock !== over) {
                          reorderBlocks(draggedBlock, over);
                        }
                      }}
                      onDragStart={setDraggedBlock}
                    >
                      <div className="content-accordion">
                        <ContentAccordionHeader
                          title="РџРѕРґР°СЂРєРё Рё РїРѕР¶РµР»Р°РЅРёСЏ"
                          isOpen={openSections.includes("WISHLIST")}
                          onOpen={() => toggleSection("WISHLIST")}
                        />
                        {openSections.includes("WISHLIST") && (
                          <div className="accordion-body wishlist-editor">
                            <label className="constructor-field">
                              <span>РЎСЃС‹Р»РєР° РґР»СЏ РґРёСЃС‚Р°РЅС†РёРѕРЅРЅРѕРіРѕ РїРѕРґР°СЂРєР°</span>
                              <input
                                type="url"
                                value={giftPaymentLink}
                                placeholder="https://pay.example.ru/..."
                                onChange={(event) =>
                                  setGiftPaymentLink(event.target.value)
                                }
                                onBlur={saveExtrasQuietly}
                              />
                            </label>
                            <div className="gift-qr-editor">
                              <div>
                                <strong>QR-РєРѕРґ РґР»СЏ РїРѕРґР°СЂРєР°</strong>
                                <small>РџРѕРєР°Р¶РµРј РіРѕСЃС‚СЋ, РµСЃР»Рё РѕРЅ РЅРµ СЃРјРѕР¶РµС‚ РїСЂРёР№С‚Рё</small>
                              </div>
                              {giftQrCode ? (
                                <figure>
                                  <Image
                                    src={giftQrCode}
                                    alt="QR-РєРѕРґ РїРѕРґР°СЂРєР°"
                                    fill
                                    unoptimized
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGiftQrCode(null);
                                      window.setTimeout(saveExtrasQuietly, 0);
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </figure>
                              ) : (
                                <label>
                                  <Upload size={16} />
                                  Р—Р°РіСЂСѓР·РёС‚СЊ QR
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(event) =>
                                      void uploadSingleImage(
                                        event.target.files?.[0],
                                        setGiftQrCode,
                                      )
                                    }
                                  />
                                </label>
                              )}
                            </div>
                            <label className="constructor-field">
                              <span>РџРѕР¶РµР»Р°РЅРёРµ РіРѕСЃС‚СЏРј</span>
                              <textarea
                                value={wishlistText}
                                onChange={(event) => setWishlistText(event.target.value)}
                                onBlur={saveExtrasQuietly}
                              />
                            </label>
                            <div className="no-flowers-setting">
                              <strong>Р‘РµР· С†РІРµС‚РѕРІ</strong>
                              <button
                                className={`switch ${noFlowersEnabled ? "is-on" : ""}`}
                                type="button"
                                role="switch"
                                aria-checked={noFlowersEnabled}
                                onClick={() => {
                                  setNoFlowersEnabled(!noFlowersEnabled);
                                  window.setTimeout(saveExtrasQuietly, 0);
                                }}
                              >
                                <i />
                              </button>
                            </div>
                            {noFlowersEnabled && (
                              <label className="constructor-field">
                                <span>РўРµРєСЃС‚ РїРѕР¶РµР»Р°РЅРёСЏ Р±РµР· С†РІРµС‚РѕРІ</span>
                                <textarea
                                  value={noFlowersText}
                                  onChange={(event) => setNoFlowersText(event.target.value)}
                                  onBlur={saveExtrasQuietly}
                                />
                              </label>
                            )}
                            {wishlistItems.map((item) => (
                              <div className="wishlist-editor-row" key={item.id}>
                                <Gift size={15} />
                                <select
                                  value={item.type}
                                  aria-label="РўРёРї РїРѕРґР°СЂРєР°"
                                  onChange={(event) => {
                                    updateWishlistItem(
                                      item.id,
                                      "type",
                                      event.target.value,
                                    );
                                    window.setTimeout(saveExtrasQuietly, 0);
                                  }}
                                >
                                  <option value="ITEM">Р’РµС‰СЊ</option>
                                  <option value="EXPERIENCE">Р’РїРµС‡Р°С‚Р»РµРЅРёРµ</option>
                                </select>
                                <input
                                  value={item.title}
                                  aria-label="РќР°Р·РІР°РЅРёРµ РїРѕРґР°СЂРєР°"
                                  placeholder="РќР°Р·РІР°РЅРёРµ"
                                  onChange={(event) =>
                                    updateWishlistItem(item.id, "title", event.target.value)
                                  }
                                  onBlur={saveExtrasQuietly}
                                />
                                <input
                                  value={item.url}
                                  aria-label="РЎСЃС‹Р»РєР° РЅР° РїРѕРґР°СЂРѕРє"
                                  placeholder={
                                    item.type === "EXPERIENCE"
                                      ? "РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РѕР±С‰Р°СЏ СЃСЃС‹Р»РєР°"
                                      : "https://..."
                                  }
                                  disabled={item.type === "EXPERIENCE"}
                                  onChange={(event) =>
                                    updateWishlistItem(item.id, "url", event.target.value)
                                  }
                                  onBlur={saveExtrasQuietly}
                                />
                                <button
                                  type="button"
                                  aria-label={`РЈРґР°Р»РёС‚СЊ ${item.title}`}
                                  onClick={() => {
                                    removeWishlistItem(item.id);
                                    saveExtrasQuietly();
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              className="add-event-button"
                              type="button"
                              disabled={wishlistItems.length >= 8}
                              onClick={addWishlistItem}
                            >
                              <Plus size={16} /> Р”РѕР±Р°РІРёС‚СЊ СЃСЃС‹Р»РєСѓ
                            </button>
                          </div>
                        )}
                      </div>
                    </DraggableContentBlock>
                  );
                }

                if (block === "COORDINATOR") {
                  return (
                    <DraggableContentBlock
                      block={block}
                      draggedBlock={draggedBlock}
                      key={block}
                      onDragEnd={() => {
                        setDraggedBlock(null);
                        window.setTimeout(saveExtrasQuietly, 0);
                      }}
                      onDragOver={(over) => {
                        if (draggedBlock && draggedBlock !== over) {
                          reorderBlocks(draggedBlock, over);
                        }
                      }}
                      onDragStart={setDraggedBlock}
                    >
                      <div className="content-accordion">
                        <ContentAccordionHeader
                          title="РћСЂРіР°РЅРёР·Р°С‚РѕСЂ / РєРѕРѕСЂРґРёРЅР°С‚РѕСЂ"
                          isOpen={openSections.includes("COORDINATOR")}
                          onOpen={() => toggleSection("COORDINATOR")}
                        />
                        {openSections.includes("COORDINATOR") && (
                          <div className="accordion-body coordinator-editor">
                            <div className="coordinator-photo-editor">
                              {coordinatorPhoto ? (
                                <figure>
                                  <Image
                                    src={coordinatorPhoto}
                                    alt="Р¤РѕС‚Рѕ РєРѕРѕСЂРґРёРЅР°С‚РѕСЂР°"
                                    fill
                                    unoptimized
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCoordinatorField(
                                        "coordinatorPhoto",
                                        null,
                                      );
                                      window.setTimeout(saveExtrasQuietly, 0);
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </figure>
                              ) : (
                                <label>
                                  <UserRound size={19} />
                                  <span>Р”РѕР±Р°РІРёС‚СЊ С„РѕС‚Рѕ</span>
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(event) =>
                                      void uploadSingleImage(
                                        event.target.files?.[0],
                                        (value) =>
                                          setCoordinatorField(
                                            "coordinatorPhoto",
                                            value,
                                          ),
                                      )
                                    }
                                  />
                                </label>
                              )}
                            </div>
                            {[
                              ["coordinatorName", "РРјСЏ", coordinatorName],
                              ["coordinatorRole", "Р”РѕР»Р¶РЅРѕСЃС‚СЊ", coordinatorRole],
                              [
                                "coordinatorTelegram",
                                "РЎСЃС‹Р»РєР° РЅР° Telegram",
                                coordinatorTelegram,
                              ],
                              [
                                "coordinatorWhatsapp",
                                "РЎСЃС‹Р»РєР° РЅР° WhatsApp",
                                coordinatorWhatsapp,
                              ],
                              [
                                "coordinatorPhone",
                                "РќРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°",
                                coordinatorPhone,
                              ],
                              [
                                "coordinatorMapLink",
                                "РЎСЃС‹Р»РєР° РЅР° РєР°СЂС‚Сѓ / РјР°СЂС€СЂСѓС‚",
                                coordinatorMapLink,
                              ],
                            ].map(([field, label, value]) => (
                              <label className="constructor-field" key={field}>
                                <span>{label}</span>
                                <input
                                  value={value}
                                  placeholder={
                                    field === "coordinatorName"
                                      ? "РђРЅРЅР°"
                                      : field === "coordinatorRole"
                                        ? "РљРѕРѕСЂРґРёРЅР°С‚РѕСЂ СЃРІР°РґСЊР±С‹"
                                        : field === "coordinatorPhone"
                                          ? "+7 999 123-45-67"
                                          : "https://..."
                                  }
                                  onChange={(event) =>
                                    setCoordinatorField(
                                      field as
                                        | "coordinatorName"
                                        | "coordinatorRole"
                                        | "coordinatorTelegram"
                                        | "coordinatorWhatsapp"
                                        | "coordinatorPhone"
                                        | "coordinatorMapLink",
                                      event.target.value,
                                    )
                                  }
                                  onBlur={saveExtrasQuietly}
                                />
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </DraggableContentBlock>
                  );
                }

                if (block === "FAQ") {
                  return (
                    <DraggableContentBlock
                      block={block}
                      draggedBlock={draggedBlock}
                      key={block}
                      onDragEnd={() => {
                        setDraggedBlock(null);
                        window.setTimeout(saveExtrasQuietly, 0);
                      }}
                      onDragOver={(over) => {
                        if (draggedBlock && draggedBlock !== over) {
                          reorderBlocks(draggedBlock, over);
                        }
                      }}
                      onDragStart={setDraggedBlock}
                    >
                      <div className="content-accordion">
                        <ContentAccordionHeader
                          title="Р§Р°СЃС‚С‹Рµ РІРѕРїСЂРѕСЃС‹"
                          isOpen={openSections.includes("FAQ")}
                          onOpen={() => toggleSection("FAQ")}
                        />
                        {openSections.includes("FAQ") && (
                          <div className="accordion-body faq-editor">
                            <p>Р”РѕР±Р°РІСЊС‚Рµ РѕС‚РІРµС‚С‹ РЅР° РІРѕРїСЂРѕСЃС‹, РєРѕС‚РѕСЂС‹Рµ РіРѕСЃС‚Рё Р·Р°РґР°СЋС‚ С‡Р°С‰Рµ РІСЃРµРіРѕ.</p>
                            {faqItems.map((item, index) => (
                              <div className="faq-editor-item" key={item.id}>
                                <span>Р’РѕРїСЂРѕСЃ {index + 1}</span>
                                <input
                                  value={item.question}
                                  placeholder="РњРѕР¶РЅРѕ Р»Рё РїСЂРёРµС…Р°С‚СЊ СЃ РґРµС‚СЊРјРё?"
                                  onChange={(event) =>
                                    updateFaqItem(
                                      item.id,
                                      "question",
                                      event.target.value,
                                    )
                                  }
                                  onBlur={saveExtrasQuietly}
                                />
                                <textarea
                                  rows={3}
                                  value={item.answer}
                                  placeholder="РќР°РїРёС€РёС‚Рµ РєРѕСЂРѕС‚РєРёР№ Рё Р·Р°Р±РѕС‚Р»РёРІС‹Р№ РѕС‚РІРµС‚"
                                  onChange={(event) =>
                                    updateFaqItem(
                                      item.id,
                                      "answer",
                                      event.target.value,
                                    )
                                  }
                                  onBlur={saveExtrasQuietly}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    removeFaqItem(item.id);
                                    window.setTimeout(saveExtrasQuietly, 0);
                                  }}
                                >
                                  <Trash2 size={14} /> РЈРґР°Р»РёС‚СЊ
                                </button>
                              </div>
                            ))}
                            <button
                              className="add-event-button"
                              type="button"
                              disabled={faqItems.length >= 12}
                              onClick={() => {
                                addFaqItem();
                                window.setTimeout(saveExtrasQuietly, 0);
                              }}
                            >
                              <Plus size={15} /> Р”РѕР±Р°РІРёС‚СЊ РІРѕРїСЂРѕСЃ
                            </button>
                          </div>
                        )}
                      </div>
                    </DraggableContentBlock>
                  );
                }

                const contentModule = block as BuilderModule;

                return (
                  <DraggableContentBlock
                    block={block}
                    draggedBlock={draggedBlock}
                    key={block}
                    onDragEnd={() => {
                      setDraggedBlock(null);
                      window.setTimeout(saveExtrasQuietly, 0);
                    }}
                    onDragOver={(over) => {
                      if (draggedBlock && draggedBlock !== over) {
                        reorderBlocks(draggedBlock, over);
                      }
                    }}
                    onDragStart={setDraggedBlock}
                  >
                    <div className="content-accordion">
                  <ContentAccordionHeader
                    title={moduleLabels[contentModule]}
                    isOpen={openSections.includes(contentModule)}
                    onOpen={() => toggleSection(contentModule)}
                    enabled={moduleVisibility[contentModule]}
                    onToggle={() => toggleModule(contentModule)}
                  />

                  {openSections.includes(contentModule) && (
                    <div className="accordion-body">
                      {contentModule === "TIMELINE" && (
                        <div className="timeline-editor">
                          {timelineEvents.map((event) => (
                            <div className="timeline-editor-row" key={event.id}>
                              <input
                                type="time"
                                value={event.time}
                                aria-label="Р’СЂРµРјСЏ СЃРѕР±С‹С‚РёСЏ"
                                onChange={(changeEvent) =>
                                  updateTimelineEvent(
                                    event.id,
                                    "time",
                                    changeEvent.target.value,
                                  )
                                }
                              />
                              <input
                                value={event.title}
                                aria-label="РќР°Р·РІР°РЅРёРµ СЃРѕР±С‹С‚РёСЏ"
                                onChange={(changeEvent) =>
                                  updateTimelineEvent(
                                    event.id,
                                    "title",
                                    changeEvent.target.value,
                                  )
                                }
                              />
                              <button
                                type="button"
                                aria-label={`РЈРґР°Р»РёС‚СЊ ${event.title}`}
                                onClick={() => removeTimelineEvent(event.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                          <button
                            className="add-event-button"
                            type="button"
                            onClick={addTimelineEvent}
                          >
                            <Plus size={16} /> Р”РѕР±Р°РІРёС‚СЊ СЃРѕР±С‹С‚РёРµ
                          </button>
                        </div>
                      )}

                      {contentModule === "DRESS_CODE" && (
                        <div className="palette-editor">
                          <p>РџРѕРґР±РµСЂРёС‚Рµ РѕС‚ С‚СЂРµС… РґРѕ РїСЏС‚Рё РѕС‚С‚РµРЅРєРѕРІ РґР»СЏ РѕР±СЂР°Р·РѕРІ РіРѕСЃС‚РµР№</p>
                          <div className="palette-presets">
                            {palettePresets.map((preset) => (
                              <button
                                type="button"
                                key={preset.title}
                                onClick={() => {
                                  setColorPalette([...preset.colors]);
                                  window.setTimeout(saveExtrasQuietly, 0);
                                }}
                              >
                                <span>{preset.title}</span>
                                <i aria-hidden="true">
                                  {preset.colors.map((color) => (
                                    <b
                                      key={color}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </i>
                              </button>
                            ))}
                          </div>
                          <div className="grid w-full grid-cols-4 justify-items-center gap-3 sm:grid-cols-6 md:grid-cols-8">
                            {colorPalette.map((color, index) => (
                              <label className="min-w-0 w-full" key={`${index}-${color}`}>
                                <div className="relative h-12 w-12">
                                  <input
                                    className="!h-12 !w-12 cursor-pointer rounded-full border border-stone-200 shadow-sm transition-transform active:scale-95"
                                    type="color"
                                    value={color}
                                    aria-label={`Р¦РІРµС‚ РїР°Р»РёС‚СЂС‹ ${index + 1}`}
                                    onInput={(event) =>
                                      setPaletteColor(index, event.currentTarget.value)
                                    }
                                    onBlur={saveExtrasQuietly}
                                  />
                                  <Check
                                    className="pointer-events-none absolute inset-0 m-auto text-white drop-shadow"
                                    size={18}
                                    strokeWidth={3}
                                  />
                                </div>
                                <span className="w-full truncate text-center text-xs text-stone-500">
                                  {color.toUpperCase()}
                                </span>
                                <button
                                  type="button"
                                  disabled={colorPalette.length <= 3}
                                  aria-label={`РЈРґР°Р»РёС‚СЊ С†РІРµС‚ ${index + 1}`}
                                  onClick={() => {
                                    removePaletteColor(index);
                                    window.setTimeout(saveExtrasQuietly, 0);
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </label>
                            ))}
                          </div>
                          {colorPalette.length < 5 && (
                            <button
                              className="palette-add"
                              type="button"
                              onClick={() => {
                                addPaletteColor();
                                window.setTimeout(saveExtrasQuietly, 0);
                              }}
                            >
                              <Plus size={14} /> Р”РѕР±Р°РІРёС‚СЊ РѕС‚С‚РµРЅРѕРє
                            </button>
                          )}
                          <div className="dress-moodboard-editor">
                            <div>
                              <strong>РњСѓРґР±РѕСЂРґ РѕР±СЂР°Р·РѕРІ</strong>
                              <small>{dressMoodboard.length} РёР· 4 С„РѕС‚РѕРіСЂР°С„РёР№</small>
                            </div>
                            <div className="dress-moodboard-grid">
                              {dressMoodboard.map((photo, index) => (
                                <figure key={`${photo.slice(-16)}-${index}`}>
                                  <Image
                                    src={photo}
                                    alt={`Р РµС„РµСЂРµРЅСЃ РѕР±СЂР°Р·Р° ${index + 1}`}
                                    fill
                                    unoptimized
                                  />
                                  <button
                                    type="button"
                                    aria-label={`РЈРґР°Р»РёС‚СЊ СЂРµС„РµСЂРµРЅСЃ ${index + 1}`}
                                    onClick={() => {
                                      removeDressMoodboardPhoto(index);
                                      window.setTimeout(saveExtrasQuietly, 0);
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </figure>
                              ))}
                              {dressMoodboard.length < 4 && (
                                <label>
                                  <Images size={18} />
                                  <span>Р”РѕР±Р°РІРёС‚СЊ</span>
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(event) =>
                                      void uploadDressMoodboard(event.target.files)
                                    }
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {contentModule === "MAP" && (
                        <div className="venue-editor">
                          <label>
                            <span>РќР°Р·РІР°РЅРёРµ РїР»РѕС‰Р°РґРєРё</span>
                            <input
                              value={venueName}
                              placeholder="РЈСЃР°РґСЊР±Р° В«Р›РµСЃРЅР°СЏВ»"
                              onChange={(event) => setVenueName(event.target.value)}
                              onBlur={saveExtrasQuietly}
                            />
                          </label>
                          <AddressAutocomplete
                            value={venueAddress}
                            onChange={setVenueAddress}
                            onSelect={(suggestion) => {
                              setVenueAddress(suggestion.address);
                              setMapCoordinates(
                                suggestion.latitude,
                                suggestion.longitude,
                              );
                              window.setTimeout(saveExtrasQuietly, 0);
                            }}
                            onBlur={saveExtrasQuietly}
                          />
                          <div className="venue-coordinate-grid">
                            <label>
                              <span>РЁРёСЂРѕС‚Р°</span>
                              <input
                                type="number"
                                step="any"
                                value={mapLatitude ?? ""}
                                placeholder="55.751244"
                                onChange={(event) =>
                                  setMapCoordinates(
                                    event.target.value
                                      ? Number(event.target.value)
                                      : null,
                                    mapLongitude,
                                  )
                                }
                                onBlur={saveExtrasQuietly}
                              />
                            </label>
                            <label>
                              <span>Р”РѕР»РіРѕС‚Р°</span>
                              <input
                                type="number"
                                step="any"
                                value={mapLongitude ?? ""}
                                placeholder="37.618423"
                                onChange={(event) =>
                                  setMapCoordinates(
                                    mapLatitude,
                                    event.target.value
                                      ? Number(event.target.value)
                                      : null,
                                  )
                                }
                                onBlur={saveExtrasQuietly}
                              />
                            </label>
                          </div>
                          <small>
                            РљРѕРѕСЂРґРёРЅР°С‚С‹ РЅРµРѕР±СЏР·Р°С‚РµР»СЊРЅС‹: Р±РµР· РЅРёС… РєР°СЂС‚Р° РїРѕСЃС‚СЂРѕРёС‚СЃСЏ РїРѕ Р°РґСЂРµСЃСѓ.
                          </small>
                        </div>
                      )}

                      {contentModule === "TRANSFER" && (
                        <div className="transfer-editor">
                          <label>
                            <span>РћРїРёСЃР°РЅРёРµ С‚СЂР°РЅСЃС„РµСЂР°</span>
                            <textarea
                              rows={4}
                              value={transferDescription}
                              placeholder="РђРІС‚РѕР±СѓСЃ Р±СѓРґРµС‚ Р¶РґР°С‚СЊ РіРѕСЃС‚РµР№..."
                              onChange={(event) =>
                                setTransferDescription(event.target.value)
                              }
                              onBlur={saveExtrasQuietly}
                            />
                          </label>
                          <div>
                            <label>
                              <span>Р’СЂРµРјСЏ СЃР±РѕСЂР°</span>
                              <input
                                type="time"
                                value={transferTime}
                                onChange={(event) =>
                                  setTransferTime(event.target.value)
                                }
                                onBlur={saveExtrasQuietly}
                              />
                            </label>
                            <label>
                              <span>РњРµСЃС‚Рѕ СЃР±РѕСЂР°</span>
                              <input
                                value={transferMeetingPoint}
                                placeholder="РњРµС‚СЂРѕ, РїР»РѕС‰Р°РґСЊ РёР»Рё РѕС‚РµР»СЊ"
                                onChange={(event) =>
                                  setTransferMeetingPoint(event.target.value)
                                }
                                onBlur={saveExtrasQuietly}
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      {contentModule === "COUNTDOWN" && (
                        <div className="countdown-editor">
                          <label>
                            <span>Р—Р°РіРѕР»РѕРІРѕРє С‚Р°Р№РјРµСЂР°</span>
                            <input
                              value={countdownTitle}
                              placeholder="Р”Рѕ СЃРІР°РґСЊР±С‹ РѕСЃС‚Р°Р»РѕСЃСЊ"
                              onChange={(event) =>
                                setCountdownTitle(event.target.value)
                              }
                              onBlur={saveExtrasQuietly}
                            />
                          </label>
                          <div className="countdown-style-picker">
                            {countdownStyles.map((style) => (
                              <button
                                className={
                                  countdownStyle === style.code
                                    ? "is-selected"
                                    : ""
                                }
                                key={style.code}
                                type="button"
                                onClick={() => {
                                  setCountdownStyle(style.code);
                                  window.setTimeout(saveExtrasQuietly, 0);
                                }}
                              >
                                <i className={`timer-swatch timer-${style.code.toLowerCase()}`}>
                                  08
                                </i>
                                {style.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {contentModule !== "TIMELINE" &&
                        contentModule !== "DRESS_CODE" &&
                        contentModule !== "MAP" &&
                        contentModule !== "TRANSFER" &&
                        contentModule !== "COUNTDOWN" && (
                        <p className="module-helper">
                          Р‘Р»РѕРє РІРєР»СЋС‡РµРЅ РІ СЃС‚СЂСѓРєС‚СѓСЂСѓ РїСЂРёРіР»Р°С€РµРЅРёСЏ.
                        </p>
                      )}
                    </div>
                  )}
                    </div>
                  </DraggableContentBlock>
                );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "styles" && (
          <>
            <EditorHeading
              eyebrow="Р’РЅРµС€РЅРёР№ РІРёРґ"
              title="Р’С‹Р±РµСЂРёС‚Рµ РЅР°СЃС‚СЂРѕРµРЅРёРµ"
              description="РљРѕРЅС‚РµРЅС‚ РѕСЃС‚Р°РµС‚СЃСЏ РїСЂРµР¶РЅРёРј РїСЂРё Р»СЋР±РѕР№ СЃРјРµРЅРµ РѕС„РѕСЂРјР»РµРЅРёСЏ."
            />
            <div className="editor-section-heading">
              <span>РўРµРјС‹ РёР· РІР°С€РµР№ Р°РґРјРёРЅРєРё</span>
              <small>РќР°СЃС‚СЂР°РёРІР°Р№С‚Рµ С†РІРµС‚Р°, С€СЂРёС„С‚С‹ Рё С„РѕСЂРјС‹ РІ Р°РґРјРёРЅРєРµ, Р° Р·РґРµСЃСЊ РѕРЅРё РїРѕСЏРІСЏС‚СЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё</small>
            </div>
            <div className="constructor-theme-list">
              {catalogThemes.map((theme) => (
                <button
                  key={theme.id}
                  className={`constructor-theme-card ${
                    designTheme?.id === theme.id ? "is-selected" : ""
                  }`}
                  style={{
                    color: theme.textColor,
                    backgroundColor: theme.backgroundColor,
                    backgroundImage: theme.gradientCss ?? undefined,
                    borderColor: theme.primaryColor,
                  }}
                  type="button"
                  onClick={() => {
                    setDesignTheme(theme);
                    window.setTimeout(saveExtrasQuietly, 0);
                  }}
                >
                  <span
                    className="theme-sample"
                    style={{
                      color: theme.backgroundColor,
                      backgroundColor: theme.primaryColor,
                    }}
                  >
                    A &amp; A
                  </span>
                  <span>
                    <strong>{theme.name}</strong>
                    <small>{theme.customFont?.name ?? theme.fontFamily.replaceAll("_", " ")}</small>
                  </span>
                  <i>{designTheme?.id === theme.id && <Check size={15} />}</i>
                </button>
              ))}
            </div>
            {!catalogLoading && catalogThemes.length === 0 && (
              <p className="catalog-message">
                Р’ Р±РёР±Р»РёРѕС‚РµРєРµ РїРѕРєР° РЅРµС‚ С‚РµРј. Р”РѕР±Р°РІСЊС‚Рµ РїРµСЂРІСѓСЋ С‚РµРјСѓ РІ Р°РґРјРёРЅРєРµ, Рё РѕРЅР° СЃСЂР°Р·Сѓ РїРѕСЏРІРёС‚СЃСЏ Р·РґРµСЃСЊ.
              </p>
            )}
                  <div className="editor-section-heading">
              <span>Р¤РѕСЂРјР° С„РѕС‚РѕРіСЂР°С„РёР№</span>
              <small>Р”Р»СЏ РіР°Р»РµСЂРµРё, РјСѓРґР±РѕСЂРґР° Рё РєРѕРјР°РЅРґС‹</small>
            </div>
            <div className="photo-mask-picker">
              {photoMaskOptions.map((option) => (
                <button
                  className={photoMask === option.code ? "is-selected" : ""}
                  key={option.code}
                  type="button"
                  onClick={() => {
                    setPhotoMask(option.code);
                    window.setTimeout(saveExtrasQuietly, 0);
                  }}
                >
                  <i
                    className={`mask-swatch mask-${option.code.toLowerCase()}`}
                  />
                  <span>{option.title}</span>
                </button>
              ))}
            </div>
            <div className="editor-section-heading">
              <span>РЎС‚РёР»СЊ РєР°СЂС‚РѕС‡РµРє</span>
              <small>Р¤РѕСЂРјР° Рё РјР°С‚РµСЂРёР°Р» СЃРјС‹СЃР»РѕРІС‹С… Р±Р»РѕРєРѕРІ</small>
            </div>
            <div className="card-style-picker">
              {cardStyleOptions.map((option) => (
                <button
                  className={cardStyle === option.code ? "is-selected" : ""}
                  key={option.code}
                  type="button"
                  onClick={() => {
                    setCardStyle(option.code);
                    window.setTimeout(saveExtrasQuietly, 0);
                  }}
                >
                  <i className={`card-style-swatch style-${option.code.toLowerCase()}`}>
                    <span>V</span>
                  </i>
                  <strong>{option.title}</strong>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
            <div className="style-note">
              <Sparkles size={18} />
              <span>
                РР·РјРµРЅРµРЅРёРµ РєР°СЂС‚РѕС‡РµРє РІР»РёСЏРµС‚ С‚РѕР»СЊРєРѕ РЅР° С„РѕСЂРјСѓ Р±Р»РѕРєРѕРІ, РєРѕРЅС‚РµРЅС‚ РѕСЃС‚Р°РµС‚СЃСЏ РЅР° РјРµСЃС‚Рµ Рё РЅРµ С‚РµСЂСЏРµС‚СЃСЏ.
              </span>
            </div>
          </>
        )}

        {activeTab === "music" && (
          <>
            <EditorHeading
              eyebrow="РњСѓР·С‹РєР°Р»СЊРЅРѕРµ РЅР°СЃС‚СЂРѕРµРЅРёРµ"
              title="РњСѓР·С‹РєР° РїСЂРёРіР»Р°С€РµРЅРёСЏ"
              description="Р’С‹Р±РµСЂРёС‚Рµ СЃРїРѕРєРѕР№РЅСѓСЋ РєРѕРјРїРѕР·РёС†РёСЋ РёР· Р±РёР±Р»РёРѕС‚РµРєРё РёР»Рё Р·Р°РіСЂСѓР·РёС‚Рµ СЃРІРѕР№ MP3."
            />
            <div className="default-track-list">
              {catalogTracks.map((track) => {
                const selected = musicTrack === track.id;

                return (
                  <article
                    className={selected ? "is-selected" : ""}
                    key={track.id}
                  >
                    <div>
                      <Music2 size={17} />
                      <span>
                        <strong>{track.title}</strong>
                        <small>{track.artist}</small>
                      </span>
                    </div>
                    <audio controls preload="none" src={track.fileUrl} />
                    <button
                      type="button"
                      onClick={() => {
                        setMusicTrack(selected ? null : track);
                        window.setTimeout(saveExtrasQuietly, 0);
                      }}
                    >
                      {selected ? <Check size={14} /> : null}
                      {selected ? "Р’С‹Р±СЂР°РЅРѕ" : "Р’С‹Р±СЂР°С‚СЊ"}
                    </button>
                  </article>
                );
              })}
            </div>
            {catalogLoading && (
              <p className="catalog-message">Р—Р°РіСЂСѓР¶Р°РµРј РјСѓР·С‹РєР°Р»СЊРЅСѓСЋ Р±РёР±Р»РёРѕС‚РµРєСѓ...</p>
            )}
            {!catalogLoading && catalogTracks.length === 0 && (
              <p className="catalog-message">
                Р’ Р±РёР±Р»РёРѕС‚РµРєРµ РїРѕРєР° РЅРµС‚ С‚СЂРµРєРѕРІ. РђРґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ РјРѕР¶РµС‚ РґРѕР±Р°РІРёС‚СЊ РёС… РІ РїР°РЅРµР»Рё СѓРїСЂР°РІР»РµРЅРёСЏ.
              </p>
            )}
            {catalogError && <p className="telegram-error">{catalogError}</p>}
            <div className="music-choice-divider">
              <span>РёР»Рё Р·Р°РіСЂСѓР·РёС‚Рµ СЃРІРѕСЋ РєРѕРјРїРѕР·РёС†РёСЋ</span>
            </div>
            <label className="custom-music-upload">
              <Music2 size={23} />
              <span>
                <strong>
                  {customMusicName ||
                    musicTrackTitle ||
                    "Р’С‹Р±СЂР°С‚СЊ MP3 СЃ РІР°С€РµРіРѕ СѓСЃС‚СЂРѕР№СЃС‚РІР°"}
                </strong>
                <small>РўРѕР»СЊРєРѕ MP3, РЅРµ Р±РѕР»РµРµ 5 РњР‘</small>
              </span>
              <input
                type="file"
                accept=".mp3,audio/mpeg"
                onChange={(event) =>
                  uploadCustomMusic(event.target.files?.[0])
                }
              />
            </label>
            {customMusicDataUrl && (
              <div className="custom-music-preview">
                <audio controls src={customMusicDataUrl} />
                <button
                  type="button"
                  onClick={() => {
                    setCustomMusic(null, null);
                    window.setTimeout(saveExtrasQuietly, 0);
                  }}
                >
                  <Trash2 size={14} /> РЈРґР°Р»РёС‚СЊ
                </button>
              </div>
            )}
            {musicError && <p className="telegram-error">{musicError}</p>}
            <p className="music-policy-note">
              Р’ РїСЂРёРіР»Р°С€РµРЅРёРё РјСѓР·С‹РєР° Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ РїРѕСЃР»Рµ РїРµСЂРІРѕРіРѕ РєР»РёРєР° РїРѕ СЌРєСЂР°РЅСѓ.
              Р—Р°РіСЂСѓР¶Р°СЏ С„Р°Р№Р», РІС‹ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚Рµ РїСЂР°РІРѕ РЅР° РµРіРѕ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ СЃРѕРіР»Р°СЃРЅРѕ
              РџРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕРјСѓ СЃРѕРіР»Р°С€РµРЅРёСЋ.
            </p>
          </>
        )}

        {activeTab === "media" && <MediaPanel />}

        {activeTab === "guests" && <GuestsPanel />}

        {activeTab === "crew" && (
          <>
            <EditorHeading
              eyebrow="Crew mode"
              title="РўР°Р№РјРёРЅРі РґР»СЏ РєРѕРјР°РЅРґС‹"
              description="РЎС‚СЂРѕРіРёР№ С‚РµС…РЅРёС‡РµСЃРєРёР№ РїР»Р°РЅ РґР»СЏ РІРµРґСѓС‰РµРіРѕ, РґРµРєРѕСЂР°С‚РѕСЂРѕРІ, С„РѕС‚РѕРіСЂР°С„Р° Рё РїР»РѕС‰Р°РґРєРё."
            />
            <div className="crew-link-note">
              <Clock3 size={18} />
              <div>
                <strong>РЎРµРєСЂРµС‚РЅР°СЏ СЃСЃС‹Р»РєР°</strong>
                <small>
                  {siteId
                    ? `/wedding/${siteId}/crew`
                    : "РџРѕСЏРІРёС‚СЃСЏ РїРѕСЃР»Рµ СЃРѕС…СЂР°РЅРµРЅРёСЏ РїСЂРѕРµРєС‚Р°"}
                </small>
              </div>
            </div>
            <div className="crew-editor">
              {crewTimings.map((item, index) => (
                <div className="crew-editor-row" key={item.id}>
                  <span>{index + 1}</span>
                  <input
                    type="time"
                    value={item.time}
                    aria-label="Р’СЂРµРјСЏ"
                    onChange={(event) =>
                      updateCrewTiming(item.id, "time", event.target.value)
                    }
                    onBlur={saveExtrasQuietly}
                  />
                  <input
                    value={item.description}
                    aria-label="РћРїРёСЃР°РЅРёРµ Р·Р°РґР°С‡Рё"
                    placeholder="РњРѕРЅС‚Р°Р¶ РґРµРєРѕСЂР°"
                    onChange={(event) =>
                      updateCrewTiming(
                        item.id,
                        "description",
                        event.target.value,
                      )
                    }
                    onBlur={saveExtrasQuietly}
                  />
                  <input
                    value={item.contactPerson}
                    aria-label="РљРѕРЅС‚Р°РєС‚РЅРѕРµ Р»РёС†Рѕ"
                    placeholder="РђРЅРЅР°, РєРѕРѕСЂРґРёРЅР°С‚РѕСЂ"
                    onChange={(event) =>
                      updateCrewTiming(
                        item.id,
                        "contactPerson",
                        event.target.value,
                      )
                    }
                    onBlur={saveExtrasQuietly}
                  />
                  <button
                    type="button"
                    aria-label={`РЈРґР°Р»РёС‚СЊ РїСѓРЅРєС‚ ${index + 1}`}
                    onClick={() => {
                      removeCrewTiming(item.id);
                      window.setTimeout(saveExtrasQuietly, 0);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                className="add-event-button"
                type="button"
                disabled={crewTimings.length >= 60}
                onClick={() => {
                  addCrewTiming();
                  window.setTimeout(saveExtrasQuietly, 0);
                }}
              >
                <Plus size={15} /> Р”РѕР±Р°РІРёС‚СЊ РїСѓРЅРєС‚ С‚Р°Р№РјРёРЅРіР°
              </button>
            </div>
          </>
        )}

        {activeTab === "publish" && (
          <PackagesPanel />
        )}
        <footer className="constructor-legal">
          <a href="#">РџРѕР»РёС‚РёРєР° РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё</a>
          <a href="#">РџРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕРµ СЃРѕРіР»Р°С€РµРЅРёРµ</a>
        </footer>
      </div>
    </aside>
  );
}

function ContentAccordionHeader({
  title,
  isOpen,
  onOpen,
  enabled,
  onToggle,
}: {
  title: string;
  isOpen: boolean;
  onOpen: () => void;
  enabled?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="content-accordion-header">
      <button type="button" onClick={onOpen}>
        <ChevronDown className={isOpen ? "is-open" : ""} size={17} />
        <span>{title}</span>
      </button>
      {onToggle && (
        <button
          className={`switch ${enabled ? "is-on" : ""}`}
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={title}
          onClick={onToggle}
        >
          <i />
        </button>
      )}
    </div>
  );
}

function EditorHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="editor-heading">
      <span>{eyebrow}</span>
      <h2 className="text-3xl leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">{title}</h2>
      <p>{description}</p>
    </header>
  );
}

type AddressSuggestion = {
  address: string;
  latitude: number;
  longitude: number;
  provider: string;
};

function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  onBlur: () => void;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused || value.trim().length < 3) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      fetch(`/api/geocode?q=${encodeURIComponent(value)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) return { suggestions: [] };
          return (await response.json()) as {
            suggestions: AddressSuggestion[];
          };
        })
        .then((data) => setSuggestions(data.suggestions))
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setSuggestions([]);
          }
        })
        .finally(() => setIsLoading(false));
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [isFocused, value]);

  return (
    <label className="address-autocomplete">
      <span>РђРґСЂРµСЃ РїР»РѕС‰Р°РґРєРё</span>
      <input
        value={value}
        autoComplete="off"
        placeholder="РќР°С‡РЅРёС‚Рµ РІРІРѕРґРёС‚СЊ Р°РґСЂРµСЃ"
        onFocus={() => setIsFocused(true)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => {
          window.setTimeout(() => setIsFocused(false), 120);
          onBlur();
        }}
      />
      {isFocused &&
        value.trim().length >= 3 &&
        (isLoading || suggestions.length > 0) && (
        <div className="address-suggestions">
          {isLoading && <small>РС‰РµРј РїРѕРґС…РѕРґСЏС‰РёРµ Р°РґСЂРµСЃР°...</small>}
          {!isLoading &&
            suggestions.map((suggestion) => (
              <button
                type="button"
                key={`${suggestion.latitude}-${suggestion.longitude}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(suggestion);
                  setSuggestions([]);
                  setIsFocused(false);
                }}
              >
                <strong>{suggestion.address}</strong>
                <small>
                  {suggestion.provider === "yandex"
                    ? "РЇРЅРґРµРєСЃ РљР°СЂС‚С‹"
                    : "OpenStreetMap"}
                </small>
              </button>
            ))}
        </div>
      )}
    </label>
  );
}

function DraggableContentBlock({
  block,
  draggedBlock,
  children,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  block: ContentBlockCode;
  draggedBlock: ContentBlockCode | null;
  children: React.ReactNode;
  onDragStart: (block: ContentBlockCode) => void;
  onDragOver: (block: ContentBlockCode) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      className={`draggable-content-block ${
        draggedBlock === block ? "is-dragging" : ""
      }`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", block);
        onDragStart(block);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver(block);
      }}
      onDragEnd={onDragEnd}
      onDrop={(event) => {
        event.preventDefault();
        onDragEnd();
      }}
    >
      <span className="drag-handle" aria-label="РџРµСЂРµС‚Р°С‰РёС‚СЊ Р±Р»РѕРє">
        <GripVertical size={16} />
      </span>
      {children}
    </div>
  );
}

