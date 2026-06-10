"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  MapPin,
  Music2,
  Palette,
  Pause,
  Play,
  Route,
  Shirt,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { OptionalModule, ThemeCode } from "@/entities/wedding/model";
import { quizSchema } from "@/features/onboarding/model/quiz-schema";
import { useQuizStore } from "@/features/onboarding/model/quiz-store";
import { DEFAULT_TRACKS } from "@/features/constructor/model/default-tracks";
import { launchSuccessConfetti } from "@/features/onboarding/lib/success-confetti";

const themes: Array<{
  code: ThemeCode;
  title: string;
  description: string;
  className: string;
}> = [
  { code: "MINIMAL", title: "Минимализм", description: "Воздух и типографика", className: "theme-minimal" },
  { code: "BOHO", title: "Бохо", description: "Теплые природные тона", className: "theme-boho" },
  { code: "CLASSIC", title: "Классика", description: "Торжественно и нежно", className: "theme-classic" },
  { code: "MODERN", title: "Модерн", description: "Смело и графично", className: "theme-modern" },
  { code: "ROMANTIC", title: "Романтика", description: "Пудровые тона и нежность", className: "theme-romantic" },
  { code: "BOTANICAL", title: "Ботаника", description: "Зелень и природная свежесть", className: "theme-botanical" },
];

const modules: Array<{
  code: OptionalModule;
  title: string;
  description: string;
  icon: typeof Users;
}> = [
  { code: "RSVP", title: "Умный опрос гостей", description: "Подтверждение участия и теплые пожелания", icon: Users },
  { code: "DRESS_CODE", title: "Пожелания по стилю", description: "Палитра и деликатные подсказки по образам", icon: Shirt },
  { code: "TIMELINE", title: "Таймлайн", description: "Красивое расписание дня", icon: Route },
  { code: "TRANSFER", title: "Трансфер", description: "Сбор заявок на поездку", icon: CalendarDays },
  { code: "MAP", title: "Карта", description: "Место и удобный маршрут", icon: MapPin },
  { code: "COUNTDOWN", title: "Таймер до свадьбы", description: "Дни, часы и минуты до вашего события", icon: CalendarDays },
];

export function QuizWizard() {
  const router = useRouter();
  const store = useQuizStore();
  const { ceremonyTime, setCeremonyTime } = store;
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [createdSite, setCreatedSite] = useState<{
    id: string;
    slug: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!ceremonyTime) {
      setCeremonyTime("17:00");
    }
  }, [ceremonyTime, setCeremonyTime]);

  const validateCurrentStep = () => {
    if (store.step === 1) {
      if (store.partnerOneName.trim().length < 2 || store.partnerTwoName.trim().length < 2) {
        setError("Пожалуйста, укажите оба имени.");
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
      setCreatedSite({ id: result.id, slug: result.slug });
      window.setTimeout(launchSuccessConfetti, 80);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось создать сайт. Попробуйте еще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
        <span className="step-label">{store.step} из 4</span>
      </header>

      <div className="progress-track">
        <div style={{ width: `${(store.step / 4) * 100}%` }} />
      </div>

      <section className="quiz-card">
        {store.step === 1 && (
          <div className="step-content">
            <span className="step-icon"><Sparkles size={22} /></span>
            <p className="eyebrow">Начнем с главного</p>
            <h1>Как вас зовут?</h1>
            <p className="step-description">
              Эти имена станут первой красивой деталью вашего приглашения.
            </p>
            <div className="field-grid">
              <label className="field">
                <span>Имя жениха</span>
                <input
                  autoFocus
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
          <div className="step-content">
            <span className="step-icon"><Palette size={22} /></span>
            <p className="eyebrow">Настроение</p>
            <h1>Какой стиль ближе?</h1>
            <p className="step-description">
              Это только начало: тему можно будет сменить в любой момент.
            </p>
            <div className="theme-grid">
              {themes.map((theme) => (
                <button
                  key={theme.code}
                  className={`theme-card ${theme.className} ${
                    store.theme === theme.code ? "is-selected" : ""
                  }`}
                  type="button"
                  onClick={() => store.setTheme(theme.code)}
                >
                  <span className="theme-check"><Check size={15} /></span>
                  <span className="theme-monogram">A &amp; A</span>
                  <strong>{theme.title}</strong>
                  <small>{theme.description}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {store.step === 3 && (
          <div className="step-content">
            <span className="step-icon"><Music2 size={22} /></span>
            <p className="eyebrow">Атмосфера</p>
            <h1>Какая музыка будет звучать?</h1>
            <p className="step-description">
              Выберите сопровождение. Позже его можно заменить своим треком.
            </p>
            <audio
              ref={audioRef}
              onEnded={() => setPlayingTrack(null)}
              onPause={() => setPlayingTrack(null)}
            />
            <div className="quiz-track-list">
              {DEFAULT_TRACKS.map((track) => {
                const selected = store.audioUrl === track.src;
                const playing = playingTrack === track.src;

                return (
                  <article
                    className={`quiz-track ${selected ? "is-selected" : ""}`}
                    key={track.id}
                  >
                    <button
                      className="quiz-track-play"
                      type="button"
                      aria-label={playing ? `Пауза: ${track.title}` : `Слушать: ${track.title}`}
                      onClick={() => {
                        const audio = audioRef.current;
                        if (!audio) return;

                        if (playing) {
                          audio.pause();
                          return;
                        }

                        audio.src = track.src;
                        void audio.play().then(
                          () => setPlayingTrack(track.src),
                          () => setPlayingTrack(null),
                        );
                      }}
                    >
                      {playing ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <span>
                      <strong>{track.title}</strong>
                      <small>{track.category}</small>
                    </span>
                    <button
                      className="quiz-track-select"
                      type="button"
                      onClick={() => store.setAudioUrl(track.src)}
                    >
                      {selected && <Check size={14} />}
                      {selected ? "Выбрано" : "Выбрать"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {store.step === 4 && (
          <div className="step-content">
            <span className="step-icon"><Sparkles size={22} /></span>
            <p className="eyebrow">Последний штрих</p>
            <h1>Что добавить на сайт?</h1>
            <p className="step-description">
              Мы соберем структуру автоматически. Позже блоки можно менять местами.
            </p>
            <div className="module-list">
              {modules.map((module) => {
                const Icon = module.icon;
                const selected = store.modules.includes(module.code);

                return (
                  <button
                    key={module.code}
                    className={`module-option ${selected ? "is-selected" : ""}`}
                    type="button"
                    onClick={() => store.toggleModule(module.code)}
                  >
                    <span className="module-icon"><Icon size={20} /></span>
                    <span>
                      <strong>{module.title}</strong>
                      <small>{module.description}</small>
                    </span>
                    <span className="checkbox">{selected && <Check size={15} />}</span>
                  </button>
                );
              })}
            </div>
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

        {error && <p className="form-error" role="alert">{error}</p>}

        <footer className="quiz-footer">
          {store.step > 1 && (
            <button className="secondary-button" type="button" onClick={store.back}>
              Назад
            </button>
          )}
          {store.step < 4 ? (
            <button className="primary-button" type="button" onClick={handleNext}>
              Продолжить <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="primary-button"
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
      <p className="autosave-note">Ваши ответы сохраняются автоматически</p>

      {createdSite && (
        <div className="create-success-backdrop" role="presentation">
          <section
            className="create-success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-success-title"
          >
            <span className="step-icon"><Sparkles size={24} /></span>
            <p className="eyebrow">Сайт ожил</p>
            <h2 id="create-success-title">Ваше приглашение готово</h2>
            <p>
              Ссылка уже работает. Скопируйте её для гостей или продолжите
              оформление в конструкторе.
            </p>
            <div className="create-success-link">
              <span>{`${window.location.origin}/wedding/${createdSite.slug}`}</span>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/wedding/${createdSite.slug}`,
                  );
                  setIsCopied(true);
                  window.setTimeout(() => setIsCopied(false), 1800);
                }}
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                {isCopied ? "Скопировано" : "Копировать"}
              </button>
            </div>
            <div className="create-success-actions">
              <a
                href={`/wedding/${createdSite.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                Открыть сайт <ExternalLink size={16} />
              </a>
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/constructor?siteId=${encodeURIComponent(createdSite.id)}`;
                }}
              >
                Перейти в конструктор <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
