"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Music2,
  Palette,
  Route,
  Shirt,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type {
  AudioTrackOption,
  DesignThemeOption,
  InvitationTemplateOption,
  OptionalModule,
} from "@/entities/wedding/model";
import { quizSchema } from "@/features/onboarding/model/quiz-schema";
import { useQuizStore } from "@/features/onboarding/model/quiz-store";

const TOTAL_STEPS = 3;

const modules: Array<{
  code: OptionalModule;
  title: string;
  description: string;
  icon: typeof Users;
}> = [
  {
    code: "RSVP",
    title: "Умный опрос гостей",
    description: "Подтверждение участия, меню и пожелания",
    icon: Users,
  },
  {
    code: "DRESS_CODE",
    title: "Пожелания по стилю",
    description: "Палитра и деликатные подсказки по образам",
    icon: Shirt,
  },
  {
    code: "TIMELINE",
    title: "План дня",
    description: "Красивое расписание свадьбы",
    icon: Route,
  },
  {
    code: "TRANSFER",
    title: "Забота о дороге",
    description: "Заявки на трансфер и место сбора",
    icon: CalendarDays,
  },
  {
    code: "MAP",
    title: "Место встречи",
    description: "Адрес, карта и удобный маршрут",
    icon: MapPin,
  },
  {
    code: "COUNTDOWN",
    title: "Таймер до свадьбы",
    description: "Дни, часы и минуты до вашего события",
    icon: CalendarDays,
  },
];

type Catalog = {
  tracks: AudioTrackOption[];
  templates: InvitationTemplateOption[];
  designThemes: DesignThemeOption[];
};

export function QuizWizard() {
  const router = useRouter();
  const store = useQuizStore();
  const { ceremonyTime, setCeremonyTime } = store;
  const [catalog, setCatalog] = useState<Catalog>({
    tracks: [],
    templates: [],
    designThemes: [],
  });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  useEffect(() => {
    if (!ceremonyTime) {
      setCeremonyTime("17:00");
    }
  }, [ceremonyTime, setCeremonyTime]);

  useEffect(() => {
    let active = true;

    void fetch("/api/catalog", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("catalog");
        return (await response.json()) as Catalog;
      })
      .then((data) => {
        if (!active) return;
        setCatalog({
          tracks: data.tracks ?? [],
          templates: data.templates ?? [],
          designThemes: data.designThemes ?? [],
        });
      })
      .catch(() => {
        if (active) {
          setError("Каталог админки временно недоступен.");
        }
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (store.step > TOTAL_STEPS) {
      store.back();
    }
  }, [store]);

  const validateCurrentStep = () => {
    if (store.step === 1) {
      if (
        store.partnerOneName.trim().length < 2 ||
        store.partnerTwoName.trim().length < 2
      ) {
        setError("Пожалуйста, укажите имена жениха и невесты.");
        return false;
      }
      if (!store.weddingDate) {
        setError("Выберите дату свадьбы.");
        return false;
      }
      if (!store.ceremonyTime) {
        setError("Укажите точное время начала мероприятия.");
        return false;
      }
    }

    if (store.step === 2 && catalog.designThemes.length > 0) {
      if (!store.designThemeId) {
        setError("Выберите тему оформления из каталога.");
        return false;
      }
    }

    setError("");
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      store.next();
    }
  };

  const handleSubmit = async () => {
    const payload = {
      partnerOneName: store.partnerOneName,
      partnerTwoName: store.partnerTwoName,
      weddingDate: store.weddingDate,
      ceremonyTime: store.ceremonyTime,
      theme: store.theme,
      templateStyle: store.templateStyle,
      designThemeId: store.designThemeId,
      musicTrackId: store.musicTrackId,
      invitationTemplateId: store.invitationTemplateId,
      audioUrl: store.audioUrl,
      modules: store.modules,
      acceptedTerms: store.acceptedTerms,
    };
    const parsed = quizSchema.safeParse(payload);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Проверьте введенные данные.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/wedding-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = (await response.json()) as {
        id?: string;
        slug?: string;
        error?: string;
      };

      if (!response.ok || !result.id || !result.slug) {
        throw new Error(result.error ?? "Не удалось создать сайт.");
      }

      localStorage.removeItem("wedding-builder-quiz");
      window.location.href = `/constructor?siteId=${encodeURIComponent(result.id)}`;
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Сервис временно недоступен. Попробуйте еще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectTheme = (theme: DesignThemeOption) => {
    store.setTheme("MINIMAL");
    store.setDesignThemeId(theme.id);
    store.setInvitationTemplateId(store.invitationTemplateId);
  };

  const selectTemplate = (template: InvitationTemplateOption) => {
    store.setInvitationTemplateId(template.id);
  };

  const selectTrack = (track: AudioTrackOption) => {
    const nextSelected = store.musicTrackId === track.id ? "" : track.id;
    store.setMusicTrackId(nextSelected);
    store.setAudioUrl(nextSelected ? track.fileUrl : "");
  };

  return (
    <main className="quiz-layout">
      <header className="quiz-header">
        <button
          className="icon-button"
          type="button"
          aria-label="Назад"
          onClick={() => (store.step === 1 ? router.push("/") : store.back())}
        >
          <ArrowLeft size={20} />
        </button>
        <span className="brand">vowly</span>
        <span className="step-label">
          {store.step} из {TOTAL_STEPS}
        </span>
      </header>

      <div className="progress-track">
        <div style={{ width: `${(store.step / TOTAL_STEPS) * 100}%` }} />
      </div>

      <section className="quiz-card">
        {store.step === 1 && (
          <div className="step-content animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
            <span className="step-icon">
              <Sparkles size={22} />
            </span>
            <p className="eyebrow">Начнем с главного</p>
            <h1 className="text-3xl leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Как вас зовут?
            </h1>
            <p className="step-description">
              Эти имена станут первой красивой деталью вашего приглашения.
            </p>
            <div className="field-grid">
              <label className="field">
                <span>Имя жениха</span>
                <input
                  autoFocus
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={store.partnerOneName}
                  onChange={(event) =>
                    store.setNames(event.target.value, store.partnerTwoName)
                  }
                  placeholder="Жених"
                />
              </label>
              <label className="field">
                <span>Имя невесты</span>
                <input
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={store.partnerTwoName}
                  onChange={(event) =>
                    store.setNames(store.partnerOneName, event.target.value)
                  }
                  placeholder="Невеста"
                />
              </label>
            </div>
            <label className="field">
              <span>Дата свадьбы</span>
              <div className="input-with-icon">
                <CalendarDays size={18} />
                <input
                  type="date"
                  value={store.weddingDate}
                  onChange={(event) => store.setWeddingDate(event.target.value)}
                />
              </div>
            </label>
            <label className="field">
              <span>Точное время начала</span>
              <div className="input-with-icon">
                <CalendarDays size={18} />
                <input
                  type="time"
                  step={15 * 60}
                  value={store.ceremonyTime}
                  onChange={(event) => store.setCeremonyTime(event.target.value)}
                />
              </div>
            </label>
          </div>
        )}

        {store.step === 2 && (
          <div className="step-content animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
            <span className="step-icon">
              <Palette size={22} />
            </span>
            <p className="eyebrow">Визуальная основа</p>
            <h1 className="text-3xl leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Выберите тему
            </h1>
            <p className="step-description">
              Здесь показываются только темы, которые добавлены в админке.
            </p>

            {catalogLoading && <p className="step-description">Загружаем каталог...</p>}
            {!catalogLoading && catalog.designThemes.length === 0 && (
              <p className="form-error">
                В админке пока нет тем. Добавьте первую тему, и она появится в квизе.
              </p>
            )}

            <div className="theme-grid">
              {catalog.designThemes.map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-card transition-all duration-200 ${
                    store.designThemeId === theme.id ? "is-selected" : ""
                  }`}
                  style={{
                    color: theme.textColor,
                    backgroundColor: theme.backgroundColor,
                    backgroundImage: theme.gradientCss ?? undefined,
                    borderColor: theme.primaryColor,
                    fontFamily: theme.customFont
                      ? `"${theme.customFont.family}", serif`
                      : "serif",
                  }}
                  type="button"
                  onClick={() => selectTheme(theme)}
                >
                  <span className="theme-check">
                    <Check size={15} />
                  </span>
                  <span className="theme-monogram">A &amp; A</span>
                  <strong>{theme.name}</strong>
                  <small>{theme.customFont?.name ?? theme.fontFamily}</small>
                </button>
              ))}
            </div>

            {catalog.templates.length > 0 && (
              <>
                <p className="eyebrow mt-8">Текст приглашения</p>
                <div className="module-list">
                  {catalog.templates.map((template) => (
                    <button
                      key={template.id}
                      className={`module-option transition-all duration-200 ${
                        store.invitationTemplateId === template.id
                          ? "is-selected"
                          : ""
                      }`}
                      type="button"
                      onClick={() => selectTemplate(template)}
                    >
                      <span>
                        <strong>{template.title}</strong>
                        <small>{template.content}</small>
                      </span>
                      <span className="checkbox">
                        {store.invitationTemplateId === template.id && (
                          <Check size={15} />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {store.step === 3 && (
          <div className="step-content animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
            <span className="step-icon">
              <Sparkles size={22} />
            </span>
            <p className="eyebrow">Последний штрих</p>
            <h1 className="text-3xl leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Что добавить на сайт?
            </h1>
            <p className="step-description">
              Выберите блоки и музыку. Все это можно будет изменить в конструкторе.
            </p>
            <div className="module-list">
              {modules.map((module) => {
                const Icon = module.icon;
                const selected = store.modules.includes(module.code);

                return (
                  <button
                    key={module.code}
                    className={`module-option transition-all duration-200 ${
                      selected ? "is-selected" : ""
                    }`}
                    type="button"
                    onClick={() => store.toggleModule(module.code)}
                  >
                    <span className="module-icon">
                      <Icon size={20} />
                    </span>
                    <span>
                      <strong>{module.title}</strong>
                      <small>{module.description}</small>
                    </span>
                    <span className="checkbox">
                      {selected && <Check size={15} />}
                    </span>
                  </button>
                );
              })}
            </div>

            {catalog.tracks.length > 0 && (
              <>
                <p className="eyebrow mt-8">Музыка из админки</p>
                <div className="w-full flex flex-col gap-2">
                  {catalog.tracks.map((track) => (
                    <article
                      className={`w-full flex items-center justify-between p-3 bg-stone-50 rounded-xl border transition-all duration-200 ${
                        store.musicTrackId === track.id
                          ? "border-stone-900"
                          : "border-stone-200"
                      }`}
                      key={track.id}
                    >
                      <button
                        className="h-11 w-11 flex items-center justify-center bg-white border rounded-full text-stone-700 shadow-sm active:scale-95 transition-transform"
                        type="button"
                        onClick={() =>
                          setPlayingTrackId(
                            playingTrackId === track.id ? null : track.id,
                          )
                        }
                      >
                        {playingTrackId === track.id ? "Ⅱ" : "▶"}
                      </button>
                      <span className="flex-1 ml-4 text-sm font-medium text-stone-900 truncate">
                        {track.title} · {track.artist}
                      </span>
                      <button
                        className="secondary-button flex-shrink-0 whitespace-nowrap"
                        type="button"
                        onClick={() => selectTrack(track)}
                      >
                        {store.musicTrackId === track.id ? "Выбрано" : "Выбрать"}
                      </button>
                      {playingTrackId === track.id && (
                        <audio autoPlay src={track.fileUrl} />
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}

            <label className="legal-consent">
              <input
                type="checkbox"
                checked={store.acceptedTerms}
                onChange={(event) =>
                  store.setAcceptedTerms(event.currentTarget.checked)
                }
              />
              <span>
                Я даю согласие на обработку персональных данных и принимаю
                условия <a href="#">Пользовательского соглашения</a>.
              </span>
            </label>
          </div>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <footer className="quiz-footer">
          {store.step > 1 && (
            <button
              className="secondary-button flex-shrink-0 whitespace-nowrap"
              type="button"
              onClick={store.back}
            >
              Назад
            </button>
          )}
          {store.step < TOTAL_STEPS ? (
            <button
              className="primary-button flex-shrink-0 whitespace-nowrap"
              type="button"
              onClick={handleNext}
            >
              Продолжить <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="primary-button flex-shrink-0 whitespace-nowrap"
              type="button"
              disabled={isSubmitting || !store.acceptedTerms}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Создаем..." : "Создать мой сайт"}
              {!isSubmitting && <Sparkles size={18} />}
            </button>
          )}
        </footer>
      </section>
      <p className="autosave-note">
        Ваши ответы сохраняются автоматически на этом устройстве
      </p>
    </main>
  );
}
