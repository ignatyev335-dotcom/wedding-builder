"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  LoaderCircle,
  MonitorSmartphone,
  Save,
} from "lucide-react";
import { useMemo, useState } from "react";

import type {
  ProductVisualConfig,
  ProductVisualSection,
} from "@/features/platform-visual/config";

type ProductScreen = "landing" | "quiz" | "constructor";

const screenLabels: Record<ProductScreen, string> = {
  landing: "Главная",
  quiz: "Квиз",
  constructor: "Конструктор",
};

const previewUrls: Record<ProductScreen, string> = {
  landing: "/",
  quiz: "/create",
  constructor: "/constructor",
};

export function ProductVisualEditor({
  initialConfig,
}: {
  initialConfig: ProductVisualConfig;
}) {
  const [config, setConfig] = useState<ProductVisualConfig>(initialConfig);
  const [activeScreen, setActiveScreen] = useState<ProductScreen>("landing");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewVersion, setPreviewVersion] = useState(0);

  const previewUrl = useMemo(
    () => `${previewUrls[activeScreen]}?adminPreview=${previewVersion}`,
    [activeScreen, previewVersion],
  );

  const updateLanding = <Key extends keyof ProductVisualConfig["landing"]>(
    key: Key,
    value: ProductVisualConfig["landing"][Key],
  ) => {
    setConfig((current) => ({
      ...current,
      landing: { ...current.landing, [key]: value },
    }));
    setMessage("");
    setError("");
  };

  const updateQuiz = <Key extends keyof ProductVisualConfig["quiz"]>(
    key: Key,
    value: ProductVisualConfig["quiz"][Key],
  ) => {
    setConfig((current) => ({
      ...current,
      quiz: { ...current.quiz, [key]: value },
    }));
    setMessage("");
    setError("");
  };

  const updateConstructor = <Key extends keyof ProductVisualConfig["constructor"]>(
    key: Key,
    value: ProductVisualConfig["constructor"][Key],
  ) => {
    setConfig((current) => ({
      ...current,
      constructor: { ...current.constructor, [key]: value },
    }));
    setMessage("");
    setError("");
  };

  const updateSection = (
    screen: ProductScreen,
    sectionId: string,
    patch: Partial<ProductVisualSection>,
  ) => {
    setConfig((current) => ({
      ...current,
      [screen]: {
        ...current[screen],
        sections: current[screen].sections.map((section) =>
          section.id === sectionId ? { ...section, ...patch } : section,
        ),
      },
    }));
    setMessage("");
    setError("");
  };

  const moveSection = (
    screen: ProductScreen,
    sectionId: string,
    direction: -1 | 1,
  ) => {
    setConfig((current) => {
      const sections = [...current[screen].sections].sort((a, b) => a.order - b.order);
      const index = sections.findIndex((section) => section.id === sectionId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= sections.length) {
        return current;
      }

      [sections[index], sections[targetIndex]] = [sections[targetIndex], sections[index]];
      const reordered = sections.map((section, sectionIndex) => ({
        ...section,
        order: sectionIndex + 1,
      }));

      return {
        ...current,
        [screen]: {
          ...current[screen],
          sections: reordered,
        },
      };
    });
    setMessage("");
    setError("");
  };

  const save = async () => {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/product-visual-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(config),
      });
      const payload = (await response.json()) as {
        config?: ProductVisualConfig;
        error?: string;
      };

      if (!response.ok || !payload.config) {
        throw new Error(payload.error ?? "Не удалось сохранить настройки.");
      }

      setConfig(payload.config);
      setPreviewVersion((version) => version + 1);
      setMessage("Изменения применены. Откройте экран заново или обновите превью.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось сохранить настройки.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="product-editor">
      <div className="product-editor-sidebar">
        <header className="admin-panel-heading">
          <span>
            <MonitorSmartphone size={18} />
          </span>
          <div>
            <small>Редактор продукта</small>
            <h2>Главная, квиз и конструктор</h2>
            <p>
              Управляйте текстами, видимостью, порядком и размером блоков. Это
              сохраняется в базе и применяется без правок исходного кода.
            </p>
          </div>
        </header>

        <nav className="product-editor-tabs" aria-label="Экраны продукта">
          {(Object.keys(screenLabels) as ProductScreen[]).map((screen) => (
            <button
              className={activeScreen === screen ? "is-active" : ""}
              key={screen}
              type="button"
              onClick={() => setActiveScreen(screen)}
            >
              {screenLabels[screen]}
            </button>
          ))}
        </nav>

        {activeScreen === "landing" ? (
          <LandingControls config={config} update={updateLanding} />
        ) : null}
        {activeScreen === "quiz" ? (
          <QuizControls config={config} update={updateQuiz} />
        ) : null}
        {activeScreen === "constructor" ? (
          <ConstructorControls config={config} update={updateConstructor} />
        ) : null}

        <SectionControls
          sections={config[activeScreen].sections}
          screen={activeScreen}
          updateSection={updateSection}
          moveSection={moveSection}
        />

        <div className="product-editor-save">
          <button type="button" disabled={isSaving} onClick={() => void save()}>
            {isSaving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
            Применить
          </button>
          {message ? <p className="is-success">{message}</p> : null}
          {error ? <p className="is-error">{error}</p> : null}
        </div>
      </div>

      <aside className="product-editor-preview">
        <div className="product-editor-preview-bar">
          <span>
            <Eye size={15} /> {screenLabels[activeScreen]}
          </span>
          <a href={previewUrls[activeScreen]} target="_blank" rel="noreferrer">
            Открыть отдельно
          </a>
        </div>
        <iframe key={previewUrl} src={previewUrl} title={`Превью: ${screenLabels[activeScreen]}`} />
      </aside>
    </section>
  );
}

function LandingControls({
  config,
  update,
}: {
  config: ProductVisualConfig;
  update: <Key extends keyof ProductVisualConfig["landing"]>(
    key: Key,
    value: ProductVisualConfig["landing"][Key],
  ) => void;
}) {
  return (
    <div className="product-editor-card">
      <TextField label="Бейдж первого экрана" value={config.landing.badge} onChange={(value) => update("badge", value)} />
      <TextArea label="Главный заголовок" value={config.landing.title} rows={3} onChange={(value) => update("title", value)} />
      <TextArea label="Подзаголовок" value={config.landing.subtitle} rows={4} onChange={(value) => update("subtitle", value)} />
      <div className="product-editor-grid">
        <TextField label="Главная кнопка" value={config.landing.primaryCta} onChange={(value) => update("primaryCta", value)} />
        <TextField label="Вторая кнопка" value={config.landing.secondaryCta} onChange={(value) => update("secondaryCta", value)} />
      </div>
      <div className="product-editor-grid">
        <TextField label="Имена в мокапе" value={config.landing.mockupCouple} onChange={(value) => update("mockupCouple", value)} />
        <TextField label="Дата в мокапе" value={config.landing.mockupDate} onChange={(value) => update("mockupDate", value)} />
      </div>
    </div>
  );
}

function QuizControls({
  config,
  update,
}: {
  config: ProductVisualConfig;
  update: <Key extends keyof ProductVisualConfig["quiz"]>(
    key: Key,
    value: ProductVisualConfig["quiz"][Key],
  ) => void;
}) {
  return (
    <div className="product-editor-card">
      <TextField label="Бейдж квиза" value={config.quiz.badge} onChange={(value) => update("badge", value)} />
      <TextArea label="Шаг 1: заголовок" value={config.quiz.stepOneTitle} rows={2} onChange={(value) => update("stepOneTitle", value)} />
      <TextArea label="Шаг 1: описание" value={config.quiz.stepOneDescription} rows={3} onChange={(value) => update("stepOneDescription", value)} />
      <TextArea label="Шаг стиля: заголовок" value={config.quiz.styleTitle} rows={2} onChange={(value) => update("styleTitle", value)} />
      <TextArea label="Шаг стиля: описание" value={config.quiz.styleDescription} rows={3} onChange={(value) => update("styleDescription", value)} />
      <TextArea label="Шаг особенностей: заголовок" value={config.quiz.featuresTitle} rows={2} onChange={(value) => update("featuresTitle", value)} />
      <TextArea label="Шаг особенностей: описание" value={config.quiz.featuresDescription} rows={3} onChange={(value) => update("featuresDescription", value)} />
      <TextArea label="Финал: заголовок" value={config.quiz.finalTitle} rows={2} onChange={(value) => update("finalTitle", value)} />
      <TextArea label="Финал: описание" value={config.quiz.finalDescription} rows={3} onChange={(value) => update("finalDescription", value)} />
    </div>
  );
}

function ConstructorControls({
  config,
  update,
}: {
  config: ProductVisualConfig;
  update: <Key extends keyof ProductVisualConfig["constructor"]>(
    key: Key,
    value: ProductVisualConfig["constructor"][Key],
  ) => void;
}) {
  return (
    <div className="product-editor-card">
      <TextField label="Название помощника" value={config.constructor.assistantTitle} onChange={(value) => update("assistantTitle", value)} />
      <TextArea label="Описание помощника" value={config.constructor.assistantDescription} rows={3} onChange={(value) => update("assistantDescription", value)} />
      <div className="product-editor-grid">
        <TextField label="Кнопка публикации" value={config.constructor.publishButtonText} onChange={(value) => update("publishButtonText", value)} />
        <TextField label="Кнопка предпросмотра" value={config.constructor.previewButtonText} onChange={(value) => update("previewButtonText", value)} />
      </div>
    </div>
  );
}

function SectionControls({
  sections,
  screen,
  updateSection,
  moveSection,
}: {
  sections: ProductVisualSection[];
  screen: ProductScreen;
  updateSection: (
    screen: ProductScreen,
    sectionId: string,
    patch: Partial<ProductVisualSection>,
  ) => void;
  moveSection: (screen: ProductScreen, sectionId: string, direction: -1 | 1) => void;
}) {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="product-editor-card">
      <h3>Блоки экрана</h3>
      <div className="product-section-list">
        {sortedSections.map((section, index) => (
          <article key={section.id}>
            <label>
              <input
                checked={section.enabled}
                type="checkbox"
                onChange={(event) =>
                  updateSection(screen, section.id, { enabled: event.target.checked })
                }
              />
              <span>{section.label}</span>
            </label>
            <div className="product-section-settings">
              <select
                value={section.size}
                title="Размер блока"
                onChange={(event) =>
                  updateSection(screen, section.id, {
                    size: event.target.value as ProductVisualSection["size"],
                  })
                }
              >
                <option value="compact">Компактный</option>
                <option value="normal">Обычный</option>
                <option value="large">Крупный</option>
              </select>
              <select
                value={section.align}
                title="Положение блока"
                onChange={(event) =>
                  updateSection(screen, section.id, {
                    align: event.target.value as ProductVisualSection["align"],
                  })
                }
              >
                <option value="left">Слева</option>
                <option value="center">По центру</option>
                <option value="right">Справа</option>
              </select>
              <select
                value={section.textAlign}
                title="Выравнивание текста"
                onChange={(event) =>
                  updateSection(screen, section.id, {
                    textAlign: event.target.value as ProductVisualSection["textAlign"],
                  })
                }
              >
                <option value="left">Текст слева</option>
                <option value="center">Текст центр</option>
                <option value="right">Текст справа</option>
              </select>
              <select
                value={section.density}
                title="Отступы"
                onChange={(event) =>
                  updateSection(screen, section.id, {
                    density: event.target.value as ProductVisualSection["density"],
                  })
                }
              >
                <option value="tight">Плотно</option>
                <option value="normal">Нормально</option>
                <option value="airy">Воздушно</option>
              </select>
              <select
                value={section.buttonSize}
                title="Размер кнопок"
                onChange={(event) =>
                  updateSection(screen, section.id, {
                    buttonSize: event.target.value as ProductVisualSection["buttonSize"],
                  })
                }
              >
                <option value="small">Кнопки S</option>
                <option value="normal">Кнопки M</option>
                <option value="large">Кнопки L</option>
              </select>
            </div>
            <div>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveSection(screen, section.id, -1)}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                disabled={index === sortedSections.length - 1}
                onClick={() => moveSection(screen, section.id, 1)}
              >
                <ArrowDown size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="visual-field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="visual-field">
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
