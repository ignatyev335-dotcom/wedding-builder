"use client";

import {
  Check,
  ChevronDown,
  FileText,
  Gift,
  GripVertical,
  Images,
  Music2,
  Palette,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  UsersRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type {
  BuilderModule,
  ContentBlockCode,
  FontCode,
  MusicTrack,
  ThemeCode,
} from "@/entities/wedding/model";
import { tracks } from "@/features/constructor/model/tracks";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";
import { GuestsPanel } from "@/features/constructor/ui/guests-panel";
import { persistSiteExtras } from "@/features/constructor/lib/persist-site-extras";
import { MediaPanel } from "@/features/constructor/ui/media-panel";
import { PackagesPanel } from "@/features/constructor/ui/packages-panel";

type Tab = "content" | "styles" | "music" | "media" | "guests" | "publish";
type ContentSection = "HERO" | "WISHLIST" | BuilderModule;

const tabs: Array<{ id: Tab; label: string; icon: typeof FileText }> = [
  { id: "content", label: "Контент", icon: FileText },
  { id: "styles", label: "Стили", icon: Palette },
  { id: "music", label: "Музыка", icon: Music2 },
  { id: "media", label: "Медиа", icon: Images },
  { id: "guests", label: "Любимые гости", icon: UsersRound },
  { id: "publish", label: "Оживить сайт", icon: Upload },
];

const moduleLabels: Record<BuilderModule, string> = {
  RSVP: "Умный опрос гостей",
  DRESS_CODE: "Пожелания по стилю",
  TIMELINE: "План счастливого дня",
  TRANSFER: "Забота о дороге",
  MAP: "Место встречи",
  COUNTDOWN: "Таймер до свадьбы",
};

const invitationTemplates = {
  official:
    "С радостью приглашаем вас на торжество, посвященное дню нашей свадьбы. Для нас будет большой честью разделить этот важный момент вместе с вами.",
  heartfelt:
    "{names} приглашают вас разделить этот особенный день. Мы не представляем этот праздник без самых близких людей и будем счастливы видеть вас рядом.",
  playful:
    "Кажется, всё серьезно: мы женимся! Приходите обнимать нас, смеяться, танцевать и стать частью дня, который мы точно никогда не забудем.",
  concise:
    "Будем счастливы видеть вас рядом в день нашей свадьбы. До встречи на празднике!",
} as const;

const themeOptions: Array<{
  code: ThemeCode;
  title: string;
  description: string;
}> = [
  {
    code: "MINIMAL",
    title: "Минимализм",
    description: "Белый фон, строгая сетка и точная типографика",
  },
  {
    code: "BOTANICAL",
    title: "Ботаника",
    description: "Глубокая зелень, природные слои и мягкие карточки",
  },
  {
    code: "MODERN",
    title: "Дарк / Вечер",
    description: "Графитовый фон, золотые акценты и атмосфера ужина",
  },
  {
    code: "ROMANTIC",
    title: "Романтика",
    description: "Пудровая палитра и воздушная каллиграфия",
  },
];

const themeDefaultFonts: Partial<Record<ThemeCode, FontCode>> = {
  MINIMAL: "PLAYFAIR",
  BOTANICAL: "CORMORANT",
  MODERN: "MONTSERRAT",
  ROMANTIC: "GREAT_VIBES",
};

const fontOptions: Array<{
  code: FontCode;
  title: string;
  description: string;
}> = [
  { code: "GREAT_VIBES", title: "Great Vibes", description: "Мягкая свадебная каллиграфия" },
  { code: "PINYON", title: "Pinyon Script", description: "Тонкая церемониальная вязь" },
  { code: "ALEX_BRUSH", title: "Alex Brush", description: "Живой каллиграфический росчерк" },
  { code: "PLAYFAIR", title: "Playfair Display", description: "Элегантная классика" },
  { code: "CORMORANT", title: "Cormorant Garamond", description: "Воздушная антиква" },
  { code: "MONTSERRAT", title: "Montserrat", description: "Чистый современный гротеск" },
];

export function ConstructorSidebar({
  initialTab = "content",
}: {
  initialTab?: Tab;
}) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [openSections, setOpenSections] = useState<ContentSection[]>([
    "HERO",
    "TIMELINE",
    "DRESS_CODE",
  ]);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<ContentBlockCode | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const saveExtrasQuietly = () => {
    void persistSiteExtras().catch(() => undefined);
  };
  const {
    partnerOneName,
    partnerTwoName,
    weddingDate,
    ceremonyTime,
    venueName,
    venueAddress,
    mapLatitude,
    mapLongitude,
    currentTheme,
    fontCode,
    blockOrder,
    moduleVisibility,
    musicTrack,
    timelineEvents,
    colorPalette,
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
    coverPhoto,
    setNames,
    setWeddingDate,
    setCeremonyTime,
    setVenueName,
    setVenueAddress,
    setMapCoordinates,
    setCurrentTheme,
    setFontCode,
    reorderBlocks,
    toggleModule,
    setMusicTrack,
    addTimelineEvent,
    updateTimelineEvent,
    removeTimelineEvent,
    setPaletteColor,
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
  } = useWeddingStore();
  const completion =
    (partnerOneName.trim() && partnerTwoName.trim() && weddingDate ? 20 : 0) +
    (coverPhoto ? 20 : 0) +
    (timelineEvents.length > 0 && timelineEvents.every((event) => event.time && event.title.trim())
      ? 20
      : 0) +
    (moduleVisibility.RSVP ? 20 : 0) +
    (musicTrack ? 20 : 0);

  const applyInvitationTemplate = (template: keyof typeof invitationTemplates) => {
    const names = `${partnerOneName || "Александр"} и ${partnerTwoName || "Валентина"}`;
    setInvitationText(invitationTemplates[template].replace("{names}", names));
    saveExtrasQuietly();
  };

  useEffect(() => {
    const openPublish = () => setActiveTab("publish");
    window.addEventListener("vowly-open-publish", openPublish);

    return () => {
      previewAudioRef.current?.pause();
      window.removeEventListener("vowly-open-publish", openPublish);
    };
  }, []);

  const toggleSection = (section: ContentSection) => {
    setOpenSections((sections) =>
      sections.includes(section)
        ? sections.filter((current) => current !== section)
        : [...sections, section],
    );
  };

  const toggleTrackPreview = async (track: MusicTrack) => {
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio();
    }

    const audio = previewAudioRef.current;
    if (previewTrackId === track.id && !audio.paused) {
      audio.pause();
      setPreviewTrackId(null);
      return;
    }

    audio.pause();
    audio.src = track.url;
    audio.currentTime = 0;

    try {
      await audio.play();
      setPreviewTrackId(track.id);
    } catch {
      setPreviewTrackId(null);
    }
  };

  return (
    <aside className="constructor-sidebar">
      <nav className="constructor-tabs" aria-label="Разделы конструктора">
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
            <span>Ваш сайт становится живым</span>
            <strong>{completion}%</strong>
          </div>
          <div className="constructor-progress-track">
            <i style={{ width: `${completion}%` }} />
          </div>
          <p>
            Ваш идеальный сайт готов на {completion}%.{" "}
            {completion === 100
              ? "Можно делиться с любимыми гостями!"
              : "Осталось совсем чуть-чуть!"}
          </p>
        </section>

        {activeTab === "content" && (
          <>
            <EditorHeading
              eyebrow="Содержание"
              title="Расскажите вашу историю"
              description="Все изменения сразу появляются в предпросмотре."
            />

            <section className="post-wedding-toggle">
              <div>
                <strong>Режим «После свадьбы»</strong>
                <small>
                  Включите этот режим после мероприятия, чтобы отключить опрос
                  гостей и собрать их фото
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
              <label className="constructor-field post-wedding-link-field">
                <span>Ссылка на облако для фотографий</span>
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
                  Гости перейдут по этой ссылке, чтобы поделиться снимками.
                </small>
              </label>
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
                      <span>Первое имя</span>
                      <input
                        value={partnerOneName}
                        onChange={(event) =>
                          setNames(event.target.value, partnerTwoName)
                        }
                      />
                    </label>
                    <label className="constructor-field">
                      <span>Второе имя</span>
                      <input
                        value={partnerTwoName}
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
                      value={ceremonyTime}
                      onChange={(event) => setCeremonyTime(event.target.value)}
                      onBlur={saveExtrasQuietly}
                    />
                  </label>
                  <label className="constructor-field invitation-copy-field">
                    <span>Текст приглашения</span>
                    <div className="tone-chips" aria-label="Стиль текста">
                      <button type="button" onClick={() => applyInvitationTemplate("official")}>
                        Официально
                      </button>
                      <button type="button" onClick={() => applyInvitationTemplate("heartfelt")}>
                        Душевно
                      </button>
                      <button type="button" onClick={() => applyInvitationTemplate("playful")}>
                        С юмором
                      </button>
                      <button type="button" onClick={() => applyInvitationTemplate("concise")}>
                        Лаконично
                      </button>
                    </div>
                    <textarea
                      value={invitationText}
                      onChange={(event) => setInvitationText(event.target.value)}
                      onBlur={saveExtrasQuietly}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="editor-section-heading">
              <span>Блоки сайта</span>
              <small>Настройте содержание</small>
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
                              <span>Пожелание гостям</span>
                              <textarea
                                value={wishlistText}
                                onChange={(event) => setWishlistText(event.target.value)}
                                onBlur={saveExtrasQuietly}
                              />
                            </label>
                            <div className="no-flowers-setting">
                              <div>
                                <strong>Тренды: без цветов</strong>
                                <small>Предложите гостям красивую альтернативу букетам</small>
                              </div>
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
                                  placeholder="https://..."
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
                          <p>Подберите пять оттенков, которые поддержат настроение праздника</p>
                          <div>
                            {colorPalette.map((color, index) => (
                              <label key={`${index}-${color}`}>
                                <input
                                  type="color"
                                  value={color}
                                  aria-label={`Цвет палитры ${index + 1}`}
                                  onInput={(event) =>
                                    setPaletteColor(index, event.currentTarget.value)
                                  }
                                />
                                <span>{color.toUpperCase()}</span>
                              </label>
                            ))}
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

                      {contentModule !== "TIMELINE" &&
                        contentModule !== "DRESS_CODE" &&
                        contentModule !== "MAP" &&
                        contentModule !== "TRANSFER" && (
                        <p className="module-helper">
                          {contentModule === "COUNTDOWN"
                            ? `Отсчет идет до ${weddingDate || "даты свадьбы"} в ${ceremonyTime || "указанное время"}.`
                            : "Блок включен в структуру приглашения."}
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

        {activeTab === "styles" && (
          <>
            <EditorHeading
              eyebrow="Внешний вид"
              title="Выберите настроение"
              description="Контент остается прежним при любой смене оформления."
            />
            <div className="constructor-theme-list">
              {themeOptions.map((theme) => (
                <button
                  key={theme.code}
                  className={`constructor-theme-card theme-sample-${theme.code.toLowerCase()} ${
                    currentTheme === theme.code ? "is-selected" : ""
                  }`}
                  type="button"
                  onClick={() => {
                    setCurrentTheme(theme.code);
                    const defaultFont = themeDefaultFonts[theme.code];
                    if (defaultFont) setFontCode(defaultFont);
                  }}
                >
                  <span className="theme-sample">A &amp; A</span>
                  <span>
                    <strong>{theme.title}</strong>
                    <small>{theme.description}</small>
                  </span>
                  <i>{currentTheme === theme.code && <Check size={15} />}</i>
                </button>
              ))}
            </div>
            <div className="editor-section-heading">
              <span>Типографика</span>
              <small>Шрифт всего приглашения</small>
            </div>
            <div className="font-option-grid">
              {fontOptions.map((font) => (
                <button
                  className={`font-option font-${font.code.toLowerCase()} ${
                    fontCode === font.code ? "is-selected" : ""
                  }`}
                  key={font.code}
                  type="button"
                  onClick={() => {
                    setFontCode(font.code);
                    window.setTimeout(saveExtrasQuietly, 0);
                  }}
                >
                  <span>Аа</span>
                  <strong>{font.title}</strong>
                  <small>{font.description}</small>
                </button>
              ))}
            </div>
            <div className="style-note">
              <Sparkles size={18} />
              <span>
                Смена темы работает локально и не отправляет запросов в базу.
              </span>
            </div>
          </>
        )}

        {activeTab === "music" && (
          <>
            <EditorHeading
              eyebrow="Коллекция Suno"
              title="Музыка приглашения"
              description="Прослушайте композицию и выберите настроение сайта."
            />
            <div className="music-track-list">
              {tracks.map((track) => (
                <article
                  className={musicTrack === track.id ? "is-selected" : ""}
                  key={track.id}
                >
                  <button
                    className="track-preview-button"
                    type="button"
                    aria-label={
                      previewTrackId === track.id
                        ? `Пауза ${track.title}`
                        : `Слушать ${track.title}`
                    }
                    onClick={() => toggleTrackPreview(track)}
                  >
                    {previewTrackId === track.id ? (
                      <Pause size={17} />
                    ) : (
                      <Play size={17} />
                    )}
                  </button>
                  <span>
                    <strong>{track.title}</strong>
                    <small>{track.category}</small>
                  </span>
                  <button
                    className="select-track-button"
                    type="button"
                    onClick={() =>
                      setMusicTrack(musicTrack === track.id ? null : track.id)
                    }
                  >
                    {musicTrack === track.id ? "Выбрано" : "Выбрать"}
                  </button>
                </article>
              ))}
            </div>
            <p className="music-policy-note">
              В приглашении музыка запускается после первого клика по экрану.
            </p>
          </>
        )}

        {activeTab === "media" && <MediaPanel />}

        {activeTab === "guests" && <GuestsPanel />}

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
      <h2>{title}</h2>
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
