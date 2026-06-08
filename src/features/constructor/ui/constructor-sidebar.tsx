"use client";

import {
  Check,
  ChevronDown,
  FileText,
  Gift,
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
};

const invitationTemplates = {
  official:
    "С радостью приглашаем вас на торжество, посвященное дню нашей свадьбы. Для нас будет большой честью разделить этот важный момент вместе с вами.",
  heartfelt:
    "{names} приглашают вас разделить этот особенный день. Мы не представляем этот праздник без самых близких людей и будем счастливы видеть вас рядом.",
  playful:
    "Кажется, всё серьезно: мы женимся! Приходите обнимать нас, смеяться, танцевать и стать частью дня, который мы точно никогда не забудем.",
} as const;

const themeOptions: Array<{
  code: ThemeCode;
  title: string;
  description: string;
}> = [
  {
    code: "MINIMAL",
    title: "Minimalism",
    description: "Тихая роскошь, воздух и строгая типографика",
  },
  {
    code: "BOHO",
    title: "Boho",
    description: "Теплые оттенки, мягкие формы и природные детали",
  },
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
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const saveExtrasQuietly = () => {
    void persistSiteExtras().catch(() => undefined);
  };
  const {
    partnerOneName,
    partnerTwoName,
    weddingDate,
    currentTheme,
    moduleVisibility,
    musicTrack,
    timelineEvents,
    colorPalette,
    wishlistText,
    wishlistItems,
    invitationText,
    postWeddingMode,
    coverPhoto,
    setNames,
    setWeddingDate,
    setCurrentTheme,
    toggleModule,
    setMusicTrack,
    addTimelineEvent,
    updateTimelineEvent,
    removeTimelineEvent,
    setPaletteColor,
    setWishlistText,
    addWishlistItem,
    updateWishlistItem,
    removeWishlistItem,
    setInvitationText,
    setPostWeddingMode,
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
                <small>Поблагодарите гостей и собирайте общие фотографии</small>
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
              {(Object.keys(moduleLabels) as BuilderModule[]).map((module) => (
                <div className="content-accordion" key={module}>
                  <ContentAccordionHeader
                    title={moduleLabels[module]}
                    isOpen={openSections.includes(module)}
                    onOpen={() => toggleSection(module)}
                    enabled={moduleVisibility[module]}
                    onToggle={() => toggleModule(module)}
                  />

                  {openSections.includes(module) && (
                    <div className="accordion-body">
                      {module === "TIMELINE" && (
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

                      {module === "DRESS_CODE" && (
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

                      {module !== "TIMELINE" && module !== "DRESS_CODE" && (
                        <p className="module-helper">
                          Блок включен в структуру приглашения. Расширенные поля
                          появятся на следующем шаге.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
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
                      disabled={wishlistItems.length >= 3}
                      onClick={addWishlistItem}
                    >
                      <Plus size={16} /> Добавить ссылку
                    </button>
                  </div>
                )}
              </div>
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
                  onClick={() => setCurrentTheme(theme.code)}
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
