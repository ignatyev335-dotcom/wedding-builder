"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Globe2,
  KeyRound,
  Languages,
  Link2,
  Route,
  Shirt,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { DesignThemeOption } from "@/entities/wedding/model";
import { quizSchema } from "@/features/onboarding/model/quiz-schema";
import { useQuizStore } from "@/features/onboarding/model/quiz-store";

const TOTAL_STEPS = 4;

type Catalog = {
  designThemes: DesignThemeOption[];
};

type FeatureKey =
  | "needsTransfer"
  | "strictDressCode"
  | "privateWedding"
  | "multilingualInvitation"
  | "postWeddingAutoEnabled"
  | "personalLinks";

const featureOptions: Array<{
  key: FeatureKey;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    key: "needsTransfer",
    title: "Будет трансфер",
    description: "Добавим блок про дорогу и место сбора гостей.",
    icon: Route,
  },
  {
    key: "strictDressCode",
    title: "Есть пожелания по стилю",
    description: "Сразу подготовим блок с палитрой и рекомендациями по образам.",
    icon: Shirt,
  },
  {
    key: "privateWedding",
    title: "Закрытая свадьба",
    description: "В конструкторе предложим включить PIN-код для гостей.",
    icon: KeyRound,
  },
  {
    key: "multilingualInvitation",
    title: "Гости говорят на разных языках",
    description: "Подготовим место для русской, английской и китайской версии.",
    icon: Languages,
  },
  {
    key: "postWeddingAutoEnabled",
    title: "Нужен режим после свадьбы",
    description: "После даты свадьбы сайт сможет стать страницей благодарности и фото.",
    icon: Sparkles,
  },
  {
    key: "personalLinks",
    title: "Персональные ссылки гостям",
    description: "Каждого гостя можно будет встретить по имени.",
    icon: Link2,
  },
];

export function QuizWizard() {
  const router = useRouter();
  const store = useQuizStore();
  const [catalog, setCatalog] = useState<Catalog>({ designThemes: [] });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!store.ceremonyTime) {
      store.setCeremonyTime("17:00");
    }
  }, [store]);

  useEffect(() => {
    let active = true;

    void fetch("/api/catalog", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("catalog");
        return (await response.json()) as Catalog;
      })
      .then((data) => {
        if (!active) return;
        setCatalog({ designThemes: data.designThemes ?? [] });
      })
      .catch(() => {
        if (active) {
          setError("Каталог стилей временно недоступен. Можно продолжить и выбрать стиль позже.");
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

  const selectedFeatures = useMemo(
    () => featureOptions.filter((feature) => Boolean(store[feature.key])),
    [store],
  );

  const validateCurrentStep = () => {
    if (store.step === 1) {
      if (
        store.partnerOneName.trim().length < 2 ||
        store.partnerTwoName.trim().length < 2
      ) {
        setError("Укажите имена жениха и невесты.");
        return false;
      }
      if (!store.weddingDate) {
        setError("Выберите дату свадьбы.");
        return false;
      }
      if (!store.ceremonyTime) {
        setError("Укажите время начала. По умолчанию можно оставить 17:00.");
        return false;
      }
    }

    if (store.step === 2 && catalog.designThemes.length > 0 && !store.designThemeId) {
      setError("Выберите стиль. Его потом можно будет заменить в конструкторе.");
      return false;
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
      needsTransfer: store.needsTransfer,
      strictDressCode: store.strictDressCode,
      privateWedding: store.privateWedding,
      multilingualInvitation: store.multilingualInvitation,
      postWeddingAutoEnabled: store.postWeddingAutoEnabled,
      personalLinks: store.personalLinks,
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
    store.setInvitationTemplateId("");
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
            <p className="eyebrow">Свадебный ассистент</p>
            <h1 className="text-3xl leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Начнем с основы
            </h1>
            <p className="step-description">
              Мне нужны только имена, дата и время. Остальное спокойно настроим потом.
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
              <span>Время начала</span>
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
              <Sparkles size={22} />
            </span>
            <p className="eyebrow">Стиль приглашения</p>
            <h1 className="text-3xl leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Какой стиль ближе?
            </h1>
            <p className="step-description">
              Здесь показываются стили из админки. Вы сможете добавлять новые и менять их без кода.
            </p>

            {catalogLoading && <p className="step-description">Загружаем стили...</p>}
            {!catalogLoading && catalog.designThemes.length === 0 && (
              <p className="form-error">
                В админке пока нет стилей. Можно продолжить и добавить стиль позже.
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
                      : theme.fontFamily,
                  }}
                  type="button"
                  onClick={() => selectTheme(theme)}
                >
                  <span className="theme-check">
                    <Check size={15} />
                  </span>
                  <span className="theme-monogram">A &amp; B</span>
                  <strong>{theme.name}</strong>
                  <small>{theme.customFont?.name ?? theme.fontFamily}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {store.step === 3 && (
          <div className="step-content animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
            <span className="step-icon">
              <Globe2 size={22} />
            </span>
            <p className="eyebrow">Особенности</p>
            <h1 className="text-3xl leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Есть что-то особенное?
            </h1>
            <p className="step-description">
              Отметьте только то, что действительно влияет на сценарий. Если сомневаетесь — просто идем дальше.
            </p>
            <div className="module-list">
              {featureOptions.map((feature) => {
                const Icon = feature.icon;
                const selected = Boolean(store[feature.key]);

                return (
                  <button
                    key={feature.key}
                    className={`module-option transition-all duration-200 ${
                      selected ? "is-selected" : ""
                    }`}
                    type="button"
                    onClick={() => store.setFeature(feature.key, !selected)}
                  >
                    <span className="module-icon">
                      <Icon size={20} />
                    </span>
                    <span>
                      <strong>{feature.title}</strong>
                      <small>{feature.description}</small>
                    </span>
                    <span className="checkbox">{selected && <Check size={15} />}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {store.step === 4 && (
          <div className="step-content animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
            <span className="step-icon">
              <Sparkles size={22} />
            </span>
            <p className="eyebrow">Почти готово</p>
            <h1 className="text-3xl leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Собираю ваш сайт
            </h1>
            <p className="step-description">
              Основа готова. В конструкторе вы сможете добавить фото, музыку, гостей, карту и тексты.
            </p>

            <div className="module-list">
              <article className="module-option is-selected">
                <span>
                  <strong>{store.partnerOneName || "Жених"} &amp; {store.partnerTwoName || "Невеста"}</strong>
                  <small>
                    {store.weddingDate || "Дата не выбрана"} · {store.ceremonyTime || "17:00"}
                  </small>
                </span>
                <span className="checkbox"><Check size={15} /></span>
              </article>
              <article className="module-option is-selected">
                <span>
                  <strong>Стиль</strong>
                  <small>
                    {catalog.designThemes.find((theme) => theme.id === store.designThemeId)?.name ??
                      "Выберем в конструкторе"}
                  </small>
                </span>
                <span className="checkbox"><Check size={15} /></span>
              </article>
              <article className="module-option is-selected">
                <span>
                  <strong>Особенности</strong>
                  <small>
                    {selectedFeatures.length > 0
                      ? selectedFeatures.map((feature) => feature.title).join(", ")
                      : "Без дополнительных сложностей"}
                  </small>
                </span>
                <span className="checkbox"><Check size={15} /></span>
              </article>
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
                Я даю согласие на обработку персональных данных и принимаю условия
                <a href="#"> Пользовательского соглашения</a>.
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
              Дальше <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="primary-button flex-shrink-0 whitespace-nowrap"
              type="button"
              disabled={isSubmitting || !store.acceptedTerms}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Создаем..." : "Создать сайт бесплатно ✨"}
            </button>
          )}
        </footer>
      </section>
      <p className="autosave-note">
        Не переживайте, все можно изменить позже в конструкторе.
      </p>
    </main>
  );
}
