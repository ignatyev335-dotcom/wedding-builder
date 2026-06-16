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
  MediaAssetOption,
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
  { id: "styles", label: "Стили", icon: Palette },
  { id: "music", label: "Музыка", icon: Music2 },
  { id: "media", label: "Медиа", icon: Images },
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
    title: "Шалфей и айвори",
    colors: ["#F5F0E6", "#D8D4C4", "#AEB7A1", "#74806B", "#3E4A3D"],
  },
  {
    title: "Пыльная роза",
    colors: ["#F8EDEA", "#E8CBC8", "#C99898", "#986C72", "#684B52"],
  },
  {
    title: "Шампань",
    colors: ["#FFF9ED", "#EEDFC3", "#D2B98B", "#A48659", "#66523A"],
  },
  {
    title: "Терракота",
    colors: ["#F5E5D5", "#DDB89A", "#C17C5D", "#8E513F", "#5C3931"],
  },
  {
    title: "Дымчато-синий",
    colors: ["#EEF2F3", "#CCD8DD", "#91A8B3", "#5F7783", "#344955"],
  },
  {
    title: "Черный и золото",
    colors: ["#F5F1E8", "#D7C6A3", "#A8894F", "#4A443B", "#171817"],
  },
] as const;

const countdownStyles: Array<{ code: CountdownStyleCode; title: string }> = [
  { code: "MINIMAL", title: "Минимализм" },
  { code: "TILES", title: "Карточки" },
  { code: "FLIP", title: "Табло" },
];

const photoMaskOptions: Array<{ code: PhotoMaskCode; title: string }> = [
  { code: "RECTANGLE", title: "Прямоугольник" },
  { code: "ARCH", title: "Арка" },
  { code: "OVAL", title: "Овал" },
];

const cardStyleOptions: Array<{
  code: CardStyleCode;
  title: string;
  description: string;
}> = [
  { code: "PLAIN", title: "Классика", description: "Чистые спокойные карточки" },
  { code: "ARCH", title: "Арка", description: "Мягкий архитектурный силуэт" },
  { code: "GLASS", title: "Матовое стекло", description: "Полупрозрачность и blur" },
  { code: "MONOGRAM", title: "Вензель", description: "Тонкая рамка с акцентом" },
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
  const [catalogTracks, setCatalogTracks] = useState<AudioTrackOption[]>([]);
  const [catalogTemplates, setCatalogTemplates] = useState<
    InvitationTemplateOption[]
  >([]);
  const [catalogThemes, setCatalogThemes] = useState<DesignThemeOption[]>([]);
  const [catalogMedia, setCatalogMedia] = useState<MediaAssetOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [musicError, setMusicError] = useState("");
  const [draggedBlock, setDraggedBlock] = useState<ContentBlockCode | null>(null);
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
    decorativeAsset,
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
    setDecorativeAsset,
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
    setPostWeddingPhotoUrl,
    setPostWeddingThankYouText,
  } = useWeddingStore();
  const completion =
    (partnerOneName.trim() && partnerTwoName.trim() && weddingDate ? 20 : 0) +
    (heroImageDesktop || heroImageMobile || coverPhoto ? 20 : 0) +
    (timelineEvents.length > 0 && timelineEvents.every((event) => event.time && event.title.trim())
      ? 20
      : 0) +
    (moduleVisibility.RSVP ? 20 : 0) +
    (customMusicDataUrl || musicTrack ? 20 : 0);

  const applyInvitationTemplate = (template: InvitationTemplateOption) => {
    const firstName = partnerOneName.trim();
    const secondName = partnerTwoName.trim();
    const names = [firstName, secondName].filter(Boolean).join(" и ");
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
        if (!response.ok) throw new Error("Не удалось загрузить библиотеку.");
        return (await response.json()) as {
          tracks: AudioTrackOption[];
          templates: InvitationTemplateOption[];
          designThemes: DesignThemeOption[];
          mediaAssets: MediaAssetOption[];
        };
      })
      .then((catalog) => {
        if (!active) return;
        setCatalogTracks(catalog.tracks);
        setCatalogTemplates(catalog.templates);
        setCatalogThemes(catalog.designThemes);
        setCatalogMedia(catalog.mediaAssets);
        setCatalogError("");
      })
      .catch(() => {
        if (active) setCatalogError("Библиотека временно недоступна.");
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
      setMusicError("Выберите файл в формате MP3.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMusicError("Размер MP3 не должен превышать 5 МБ.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setMusicError("Не удалось прочитать аудиофайл.");
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
        aria-label="Разделы конструктора"
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
        <section className="constructor-progress">
          <div>
            <span>Ваш сайт почти готов</span>
            <strong>{completion}%</strong>
          </div>
          <div className="constructor-progress-track">
            <i style={{ width: `${completion}%` }} />
          </div>
          <p>
            Ваш сайт готов на {completion}%.{" "}
            {completion === 100
              ? "Можно оживить сайт и отправлять."
              : "Осталось совсем немного."}
          </p>
        </section>

        {activeTab === "content" && (
          <>
            <EditorHeading
              eyebrow="Содержание"
              title="Расскажите вашу историю"
              description="Все изменения сразу отражаются в предпросмотре."
            />

            <section className="post-wedding-toggle">
              <div>
                <strong>Режим после свадьбы</strong>
                <small>
                  Включите после мероприятия: сайт станет благодарностью, а не планом подготовки и встречи.
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
            {postWeddingMode && (
              <div className="post-wedding-settings">
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
                    По этой ссылке гости смогут открыть фотографии после свадьбы.
                  </small>
                </label>
              </div>
            )}

            <div className="content-accordion">
              <ContentAccordionHeader
                title="Главный блок"
                isOpen={openSections.includes("HERO")}
                onOpen={() => toggleSection("HERO")}
              />
              {openSections.includes("HERO") && (
                <div className="accordion-body">
                  <div className="constructor-field-grid">
                    <label className="constructor-field">
                      <span>Жених</span>
                      <input
                        value={partnerOneName}
                        placeholder="Жених"
                        onChange={(event) =>
                          setNames(event.target.value, partnerTwoName)
                        }
                      />
                    </label>
                    <label className="constructor-field">
                      <span>Невеста</span>
                      <input
                        value={partnerTwoName}
                        placeholder="Невеста"
                        onChange={(event) =>
                          setNames(partnerOneName, event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <label className="constructor-field">
                    <span>Дата свадьбы</span>
                    <input
                      type="date"
                      value={weddingDate}
                      onChange={(event) => setWeddingDate(event.target.value)}
                    />
                  </label>
                  <label className="constructor-field">
                    <span>Время начала</span>
                    <input
                      type="time"
                      step={15 * 60}
                      value={ceremonyTime}
                      onChange={(event) => setCeremonyTime(event.target.value)}
                      onBlur={saveExtrasQuietly}
                    />
                  </label>
                  <label className="constructor-field invitation-copy-field">
                    <span>Текст приглашения</span>
                    <div className="tone-chips" aria-label="Стиль текста">
                      {catalogTemplates.map((template) => (
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
                      <small className="catalog-message">Загружаем шаблоны...</small>
                    )}
                    {!catalogLoading && catalogTemplates.length === 0 && (
                      <small className="catalog-message">
                        Шаблоны появятся после добавления в админке.
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
                  <span>Блоки сайта</span>
                  <small>Перетаскивайте блоки и меняйте структуру приглашения</small>
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
                          title="Подарки и пожелания"
                          isOpen={openSections.includes("WISHLIST")}
                          onOpen={() => toggleSection("WISHLIST")}
                        />
                        {openSections.includes("WISHLIST") && (
                          <div className="accordion-body wishlist-editor">
                            <label className="constructor-field">
                              <span>Ссылка для дистанционного подарка</span>
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
                                <strong>QR-код для подарка</strong>
                                <small>Покажем гостю, если он не сможет прийти</small>
                              </div>
                              {giftQrCode ? (
                                <figure>
                                  <Image
                                    src={giftQrCode}
                                    alt="QR-код подарка"
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
                                  Загрузить QR
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
                              <span>Пожелание гостям</span>
                              <textarea
                                value={wishlistText}
                                onChange={(event) => setWishlistText(event.target.value)}
                                onBlur={saveExtrasQuietly}
                              />
                            </label>
                            <div className="no-flowers-setting">
                              <strong>Без цветов</strong>
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
                                <span>Текст пожелания без цветов</span>
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
                                  aria-label="Тип подарка"
                                  onChange={(event) => {
                                    updateWishlistItem(
                                      item.id,
                                      "type",
                                      event.target.value,
                                    );
                                    window.setTimeout(saveExtrasQuietly, 0);
                                  }}
                                >
                                  <option value="ITEM">Вещь</option>
                                  <option value="EXPERIENCE">Впечатление</option>
                                </select>
                                <input
                                  value={item.title}
                                  aria-label="Название подарка"
                                  placeholder="Название"
                                  onChange={(event) =>
                                    updateWishlistItem(item.id, "title", event.target.value)
                                  }
                                  onBlur={saveExtrasQuietly}
                                />
                                <input
                                  value={item.url}
                                  aria-label="Ссылка на подарок"
                                  placeholder={
                                    item.type === "EXPERIENCE"
                                      ? "Используется общая ссылка"
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
                                  aria-label={`Удалить ${item.title}`}
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
                              <Plus size={16} /> Добавить ссылку
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
                          title="Организатор / координатор"
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
                                    alt="Фото координатора"
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
                                  <span>Добавить фото</span>
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
                              ["coordinatorName", "Имя", coordinatorName],
                              ["coordinatorRole", "Должность", coordinatorRole],
                              [
                                "coordinatorTelegram",
                                "Ссылка на Telegram",
                                coordinatorTelegram,
                              ],
                              [
                                "coordinatorWhatsapp",
                                "Ссылка на WhatsApp",
                                coordinatorWhatsapp,
                              ],
                              [
                                "coordinatorPhone",
                                "Номер телефона",
                                coordinatorPhone,
                              ],
                              [
                                "coordinatorMapLink",
                                "Ссылка на карту / маршрут",
                                coordinatorMapLink,
                              ],
                            ].map(([field, label, value]) => (
                              <label className="constructor-field" key={field}>
                                <span>{label}</span>
                                <input
                                  value={value}
                                  placeholder={
                                    field === "coordinatorName"
                                      ? "Анна"
                                      : field === "coordinatorRole"
                                        ? "Координатор свадьбы"
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
                          title="Частые вопросы"
                          isOpen={openSections.includes("FAQ")}
                          onOpen={() => toggleSection("FAQ")}
                        />
                        {openSections.includes("FAQ") && (
                          <div className="accordion-body faq-editor">
                            <p>Добавьте ответы на вопросы, которые гости задают чаще всего.</p>
                            {faqItems.map((item, index) => (
                              <div className="faq-editor-item" key={item.id}>
                                <span>Вопрос {index + 1}</span>
                                <input
                                  value={item.question}
                                  placeholder="Можно ли приехать с детьми?"
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
                                  placeholder="Напишите короткий и заботливый ответ"
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
                                  <Trash2 size={14} /> Удалить
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
                              <Plus size={15} /> Добавить вопрос
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
                                aria-label="Время события"
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
                                aria-label="Название события"
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
                                aria-label={`Удалить ${event.title}`}
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
                            <Plus size={16} /> Добавить событие
                          </button>
                        </div>
                      )}

                      {contentModule === "DRESS_CODE" && (
                        <div className="palette-editor">
                          <p>Подберите от трех до пяти оттенков для образов гостей</p>
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
                                    aria-label={`Цвет палитры ${index + 1}`}
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
                                  aria-label={`Удалить цвет ${index + 1}`}
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
                              <Plus size={14} /> Добавить оттенок
                            </button>
                          )}
                          <div className="dress-moodboard-editor">
                            <div>
                              <strong>Мудборд образов</strong>
                              <small>{dressMoodboard.length} из 4 фотографий</small>
                            </div>
                            <div className="dress-moodboard-grid">
                              {dressMoodboard.map((photo, index) => (
                                <figure key={`${photo.slice(-16)}-${index}`}>
                                  <Image
                                    src={photo}
                                    alt={`Референс образа ${index + 1}`}
                                    fill
                                    unoptimized
                                  />
                                  <button
                                    type="button"
                                    aria-label={`Удалить референс ${index + 1}`}
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
                                  <span>Добавить</span>
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
                            <span>Название площадки</span>
                            <input
                              value={venueName}
                              placeholder="Усадьба «Лесная»"
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
                              <span>Широта</span>
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
                              <span>Долгота</span>
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
                            Координаты необязательны: без них карта построится по адресу.
                          </small>
                        </div>
                      )}

                      {contentModule === "TRANSFER" && (
                        <div className="transfer-editor">
                          <label>
                            <span>Описание трансфера</span>
                            <textarea
                              rows={4}
                              value={transferDescription}
                              placeholder="Автобус будет ждать гостей..."
                              onChange={(event) =>
                                setTransferDescription(event.target.value)
                              }
                              onBlur={saveExtrasQuietly}
                            />
                          </label>
                          <div>
                            <label>
                              <span>Время сбора</span>
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
                              <span>Место сбора</span>
                              <input
                                value={transferMeetingPoint}
                                placeholder="Метро, площадь или отель"
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
                            <span>Заголовок таймера</span>
                            <input
                              value={countdownTitle}
                              placeholder="До свадьбы осталось"
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
                          Блок включен в структуру приглашения.
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
              eyebrow="Внешний вид"
              title="Выберите настроение"
              description="Контент остается прежним при любой смене оформления."
            />
            <div className="editor-section-heading">
              <span>Темы из вашей админки</span>
              <small>Настраивайте цвета, шрифты и формы в админке, а здесь они появятся автоматически</small>
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
                В библиотеке пока нет тем. Добавьте первую тему в админке, и она сразу появится здесь.
              </p>
            )}
            <div className="editor-section-heading">
              <span>Декор и иконки</span>
              <small>Загружайте SVG, PNG и декоративные элементы через админку</small>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              <button
                className={`grid min-h-28 place-items-center rounded-2xl border bg-stone-50 p-3 text-sm ${
                  !decorativeAsset ? "border-stone-900" : "border-stone-200"
                }`}
                type="button"
                onClick={() => {
                  setDecorativeAsset(null);
                  window.setTimeout(saveExtrasQuietly, 0);
                }}
              >
                Без декора
              </button>
              {catalogMedia.map((asset) => (
                <button
                  className={`grid min-h-28 place-items-center rounded-2xl border bg-stone-50 p-3 ${
                    decorativeAsset?.id === asset.id
                      ? "border-stone-900"
                      : "border-stone-200"
                  }`}
                  key={asset.id}
                  type="button"
                  title={asset.name}
                  onClick={() => {
                    setDecorativeAsset(asset);
                    window.setTimeout(saveExtrasQuietly, 0);
                  }}
                >
                  <Image
                    className="h-16 w-16 object-contain"
                    src={asset.url}
                    width={64}
                    height={64}
                    unoptimized
                    alt=""
                  />
                  <span className="w-full truncate text-xs">{asset.name}</span>
                </button>
              ))}
            </div>
            {!catalogLoading && catalogMedia.length === 0 && (
              <p className="catalog-message">
                В библиотеке пока нет декора. Вы сможете добавить иконки и стикеры в админке.
              </p>
            )}
            <div className="editor-section-heading">
              <span>Форма фотографий</span>
              <small>Для галереи, мудборда и команды</small>
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
              <span>Стиль карточек</span>
              <small>Форма и материал смысловых блоков</small>
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
                Изменение карточек влияет только на форму блоков, контент остается на месте и не теряется.
              </span>
            </div>
          </>
        )}

        {activeTab === "music" && (
          <>
            <EditorHeading
              eyebrow="Музыкальное настроение"
              title="Музыка приглашения"
              description="Выберите спокойную композицию из библиотеки или загрузите свой MP3."
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
                      {selected ? "Выбрано" : "Выбрать"}
                    </button>
                  </article>
                );
              })}
            </div>
            {catalogLoading && (
              <p className="catalog-message">Загружаем музыкальную библиотеку...</p>
            )}
            {!catalogLoading && catalogTracks.length === 0 && (
              <p className="catalog-message">
                В библиотеке пока нет треков. Администратор может добавить их в панели управления.
              </p>
            )}
            {catalogError && <p className="telegram-error">{catalogError}</p>}
            <div className="music-choice-divider">
              <span>или загрузите свою композицию</span>
            </div>
            <label className="custom-music-upload">
              <Music2 size={23} />
              <span>
                <strong>
                  {customMusicName ||
                    musicTrackTitle ||
                    "Выбрать MP3 с вашего устройства"}
                </strong>
                <small>Только MP3, не более 5 МБ</small>
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
                  <Trash2 size={14} /> Удалить
                </button>
              </div>
            )}
            {musicError && <p className="telegram-error">{musicError}</p>}
            <p className="music-policy-note">
              В приглашении музыка запускается после первого клика по экрану.
              Загружая файл, вы подтверждаете право на его использование согласно
              Пользовательскому соглашению.
            </p>
          </>
        )}

        {activeTab === "media" && <MediaPanel />}

        {activeTab === "guests" && <GuestsPanel />}

        {activeTab === "crew" && (
          <>
            <EditorHeading
              eyebrow="Crew mode"
              title="Тайминг для команды"
              description="Строгий технический план для ведущего, декораторов, фотографа и площадки."
            />
            <div className="crew-link-note">
              <Clock3 size={18} />
              <div>
                <strong>Секретная ссылка</strong>
                <small>
                  {siteId
                    ? `/wedding/${siteId}/crew`
                    : "Появится после сохранения проекта"}
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
                    aria-label="Время"
                    onChange={(event) =>
                      updateCrewTiming(item.id, "time", event.target.value)
                    }
                    onBlur={saveExtrasQuietly}
                  />
                  <input
                    value={item.description}
                    aria-label="Описание задачи"
                    placeholder="Монтаж декора"
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
                    aria-label="Контактное лицо"
                    placeholder="Анна, координатор"
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
                    aria-label={`Удалить пункт ${index + 1}`}
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
                <Plus size={15} /> Добавить пункт тайминга
              </button>
            </div>
          </>
        )}

        {activeTab === "publish" && (
          <PackagesPanel />
        )}
        <footer className="constructor-legal">
          <a href="#">Политика конфиденциальности</a>
          <a href="#">Пользовательское соглашение</a>
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
      <span>Адрес площадки</span>
      <input
        value={value}
        autoComplete="off"
        placeholder="Начните вводить адрес"
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
          {isLoading && <small>Ищем подходящие адреса...</small>}
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
                    ? "Яндекс Карты"
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
      <span className="drag-handle" aria-label="Перетащить блок">
        <GripVertical size={16} />
      </span>
      {children}
    </div>
  );
}
