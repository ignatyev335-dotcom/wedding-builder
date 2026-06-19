"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  LoaderCircle,
  Monitor,
  Save,
  Smartphone,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  cardStyleCodes,
  fontCodes,
  optionalModules,
  type BuilderModule,
  type CardStyleCode,
  type ContentBlockCode,
  type FontCode,
} from "@/entities/wedding/model";

type SiteOption = {
  id: string;
  slug: string;
  label: string;
  owner: string;
};

type DesignThemeOption = {
  id: string;
  name: string;
};

type VisualBlockCode = ContentBlockCode | "HERO" | "WELCOME" | "GALLERY" | "POST_WEDDING";

type VisualEditorDraft = {
  id: string;
  slug: string;
  owner: string;
  partnerOneName: string;
  partnerTwoName: string;
  weddingDate: string;
  ceremonyTime: string;
  venueName: string;
  venueAddress: string;
  invitationText: string;
  countdownTitle: string;
  transferDescription: string;
  transferTime: string;
  transferMeetingPoint: string;
  wishlistText: string;
  noFlowersEnabled: boolean;
  noFlowersText: string;
  postWeddingThankYouText: string;
  postWeddingPhotoUrl: string;
  coordinatorName: string;
  coordinatorRole: string;
  coordinatorPhone: string;
  fontCode: FontCode;
  cardStyle: CardStyleCode;
  designThemeId: string | null;
  blockOrder: ContentBlockCode[];
  moduleVisibility: Record<BuilderModule, boolean>;
};

const blockLabels: Record<VisualBlockCode, string> = {
  HERO: "Обложка",
  WELCOME: "Текст приглашения",
  GALLERY: "Love Story",
  POST_WEDDING: "После свадьбы",
  COUNTDOWN: "Таймер",
  TIMELINE: "Программа дня",
  DRESS_CODE: "Пожелания по стилю",
  MAP: "Место проведения",
  TRANSFER: "Забота о дороге",
  WISHLIST: "Подарки и пожелания",
  COORDINATOR: "Координатор",
  FAQ: "FAQ",
  RSVP: "Умный опрос гостей",
};

const moduleLabels: Record<BuilderModule, string> = {
  RSVP: "Умный опрос гостей",
  DRESS_CODE: "Пожелания по стилю",
  TIMELINE: "Программа дня",
  TRANSFER: "Забота о дороге",
  MAP: "Место проведения",
  COUNTDOWN: "Таймер",
};

const cardStyleLabels: Record<CardStyleCode, string> = {
  PLAIN: "Чистые карточки",
  ROUNDED: "Мягкие скругления",
  SHARP: "Строгая геометрия",
  GLASS: "Матовое стекло",
  LIQUID: "Liquid glass",
  FLOATING: "Парящие блоки",
  AURORA: "Свечение",
  EDITORIAL: "Журнальная сетка",
  SILK: "Шелковистый фон",
  MONOGRAM: "Тонкая рамка",
};

const fontLabels: Record<FontCode, string> = {
  CORMORANT: "Cormorant",
  ORANIENBAUM: "Oranienbaum",
  MARCK: "Marck Script",
  CAVEAT: "Caveat",
  BAD_SCRIPT: "Bad Script",
  PLAYFAIR: "Playfair Display",
  MONTSERRAT: "Montserrat",
};

export function VisualEditorClient({
  sites,
  selectedSite,
  designThemes,
  allBlocks,
}: {
  sites: SiteOption[];
  selectedSite: VisualEditorDraft;
  designThemes: DesignThemeOption[];
  allBlocks: ContentBlockCode[];
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastSavedDraftRef = useRef(JSON.stringify(selectedSite));
  const [draft, setDraft] = useState<VisualEditorDraft>(selectedSite);
  const [selectedBlock, setSelectedBlock] = useState<VisualBlockCode>("HERO");
  const [viewport, setViewport] = useState<"mobile" | "desktop">("mobile");
  const [previewVersion, setPreviewVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isDirty = JSON.stringify(draft) !== lastSavedDraftRef.current;
  const previewUrl = useMemo(
    () => `/wedding/${draft.slug}?editorPreview=${previewVersion}`,
    [draft.slug, previewVersion],
  );

  const postDraftToPreview = () => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "VOWLY_EDITOR_DRAFT",
        draft: {
          partnerOneName: draft.partnerOneName,
          partnerTwoName: draft.partnerTwoName,
          weddingDate: draft.weddingDate,
          ceremonyTime: draft.ceremonyTime,
          venueName: draft.venueName,
          venueAddress: draft.venueAddress,
          invitationText: draft.invitationText,
          countdownTitle: draft.countdownTitle,
          transferDescription: draft.transferDescription,
          transferTime: draft.transferTime,
          transferMeetingPoint: draft.transferMeetingPoint,
          wishlistText: draft.wishlistText,
          noFlowersEnabled: draft.noFlowersEnabled,
          noFlowersText: draft.noFlowersText,
          postWeddingThankYouText: draft.postWeddingThankYouText,
          postWeddingPhotoUrl: draft.postWeddingPhotoUrl,
          coordinatorName: draft.coordinatorName,
          coordinatorRole: draft.coordinatorRole,
          coordinatorPhone: draft.coordinatorPhone,
          fontCode: draft.fontCode,
          cardStyle: draft.cardStyle,
          blockOrder: draft.blockOrder,
          moduleVisibility: draft.moduleVisibility,
        },
      },
      window.location.origin,
    );
  };

  useEffect(() => {
    postDraftToPreview();
  }, [draft]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "VOWLY_EDITOR_READY") {
        postDraftToPreview();
      }

      if (event.data?.type === "VOWLY_EDITOR_SELECT" && event.data.block) {
        setSelectedBlock(event.data.block as VisualBlockCode);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [draft]);

  useEffect(() => {
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [isDirty]);

  const updateDraft = <Key extends keyof VisualEditorDraft>(
    key: Key,
    value: VisualEditorDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  };

  const moveBlock = (block: ContentBlockCode, direction: -1 | 1) => {
    setDraft((current) => {
      const nextOrder = [...current.blockOrder];
      const index = nextOrder.indexOf(block);
      const target = index + direction;

      if (index < 0 || target < 0 || target >= nextOrder.length) {
        return current;
      }

      [nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]];
      return { ...current, blockOrder: nextOrder };
    });
    setMessage("");
    setError("");
  };

  const toggleModule = (module: BuilderModule) => {
    setDraft((current) => ({
      ...current,
      moduleVisibility: {
        ...current.moduleVisibility,
        [module]: !current.moduleVisibility[module],
      },
    }));
    setMessage("");
    setError("");
  };

  const applyChanges = async () => {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/visual-editor/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          partnerOneName: draft.partnerOneName,
          partnerTwoName: draft.partnerTwoName,
          ceremonyTime: draft.ceremonyTime,
          venueName: draft.venueName,
          venueAddress: draft.venueAddress,
          invitationText: draft.invitationText,
          countdownTitle: draft.countdownTitle,
          transferDescription: draft.transferDescription,
          transferTime: draft.transferTime,
          transferMeetingPoint: draft.transferMeetingPoint,
          wishlistText: draft.wishlistText,
          noFlowersEnabled: draft.noFlowersEnabled,
          noFlowersText: draft.noFlowersText,
          postWeddingThankYouText: draft.postWeddingThankYouText,
          postWeddingPhotoUrl: draft.postWeddingPhotoUrl,
          coordinatorName: draft.coordinatorName,
          coordinatorRole: draft.coordinatorRole,
          coordinatorPhone: draft.coordinatorPhone,
          fontCode: draft.fontCode,
          cardStyle: draft.cardStyle,
          designThemeId: draft.designThemeId,
          blockOrder: draft.blockOrder,
          moduleVisibility: draft.moduleVisibility,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось применить изменения.");
      }

      lastSavedDraftRef.current = JSON.stringify(draft);
      setMessage("Изменения применены и сохранены в базе.");
      setPreviewVersion((version) => version + 1);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось применить изменения.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const switchSite = (siteId: string) => {
    if (isDirty && !window.confirm("Есть несохраненные изменения. Перейти к другому сайту без сохранения?")) {
      return;
    }
    window.location.assign(`/admin/visual-editor?siteId=${siteId}`);
  };

  return (
    <section className="visual-editor-shell">
      <aside className="visual-editor-sidebar">
        <div className="visual-editor-title">
          <span><Eye size={16} /> Визуальный редактор</span>
          <h1>Правьте сайт без кода</h1>
          <p>Кликайте по блоку в превью или выбирайте его в панели. В базу изменения попадут только после “Применить”.</p>
        </div>

        <label className="visual-field">
          <span>Проект</span>
          <select value={draft.id} onChange={(event) => switchSite(event.target.value)}>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.label} · {site.owner}
              </option>
            ))}
          </select>
        </label>

        <div className="visual-current-block">
          <small>Выбранный блок</small>
          <strong>{blockLabels[selectedBlock]}</strong>
          {isDirty ? <span>Есть несохраненные изменения</span> : <span className="is-clean">Все сохранено</span>}
        </div>

        <BlockPicker selectedBlock={selectedBlock} onSelect={setSelectedBlock} />

        <SelectedBlockEditor
          draft={draft}
          selectedBlock={selectedBlock}
          designThemes={designThemes}
          updateDraft={updateDraft}
          moveBlock={moveBlock}
          toggleModule={toggleModule}
          allBlocks={allBlocks}
        />

        <div className="visual-editor-actions">
          <button type="button" disabled={isSaving || !isDirty} onClick={() => void applyChanges()}>
            {isSaving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
            Применить
          </button>
          {message ? <p className="is-success">{message}</p> : null}
          {error ? <p className="is-error">{error}</p> : null}
        </div>
      </aside>

      <section className="visual-editor-preview">
        <div className="visual-preview-toolbar">
          <div>
            <strong>{draft.partnerOneName} & {draft.partnerTwoName}</strong>
            <small>/wedding/{draft.slug}</small>
          </div>
          <div>
            <button
              className={viewport === "mobile" ? "is-active" : ""}
              type="button"
              onClick={() => setViewport("mobile")}
            >
              <Smartphone size={15} /> Телефон
            </button>
            <button
              className={viewport === "desktop" ? "is-active" : ""}
              type="button"
              onClick={() => setViewport("desktop")}
            >
              <Monitor size={15} /> Компьютер
            </button>
          </div>
        </div>
        <div className={`visual-preview-frame is-${viewport}`}>
          <iframe
            ref={iframeRef}
            key={`${draft.id}-${previewVersion}-${viewport}`}
            src={previewUrl}
            title="Предпросмотр сайта Vowly"
            onLoad={postDraftToPreview}
          />
        </div>
      </section>
    </section>
  );
}

function BlockPicker({
  selectedBlock,
  onSelect,
}: {
  selectedBlock: VisualBlockCode;
  onSelect: (block: VisualBlockCode) => void;
}) {
  const blocks: VisualBlockCode[] = [
    "HERO",
    "WELCOME",
    "COUNTDOWN",
    "TIMELINE",
    "DRESS_CODE",
    "MAP",
    "TRANSFER",
    "WISHLIST",
    "COORDINATOR",
    "FAQ",
    "RSVP",
    "GALLERY",
    "POST_WEDDING",
  ];

  return (
    <div className="visual-block-picker" aria-label="Блоки сайта">
      {blocks.map((block) => (
        <button
          className={selectedBlock === block ? "is-active" : ""}
          key={block}
          type="button"
          onClick={() => onSelect(block)}
        >
          {blockLabels[block]}
        </button>
      ))}
    </div>
  );
}

function SelectedBlockEditor({
  draft,
  selectedBlock,
  designThemes,
  updateDraft,
  moveBlock,
  toggleModule,
  allBlocks,
}: {
  draft: VisualEditorDraft;
  selectedBlock: VisualBlockCode;
  designThemes: DesignThemeOption[];
  updateDraft: <Key extends keyof VisualEditorDraft>(
    key: Key,
    value: VisualEditorDraft[Key],
  ) => void;
  moveBlock: (block: ContentBlockCode, direction: -1 | 1) => void;
  toggleModule: (module: BuilderModule) => void;
  allBlocks: ContentBlockCode[];
}) {
  return (
    <section className="visual-panel">
      <h2>{blockLabels[selectedBlock]}</h2>

      {selectedBlock === "HERO" ? (
        <>
          <div className="visual-two-columns">
            <TextField label="Жених" value={draft.partnerOneName} onChange={(value) => updateDraft("partnerOneName", value)} />
            <TextField label="Невеста" value={draft.partnerTwoName} onChange={(value) => updateDraft("partnerTwoName", value)} />
          </div>
          <TextField label="Время начала" type="time" value={draft.ceremonyTime} onChange={(value) => updateDraft("ceremonyTime", value)} />
        </>
      ) : null}

      {selectedBlock === "WELCOME" ? (
        <label className="visual-field">
          <span>Текст приглашения</span>
          <textarea
            value={draft.invitationText}
            rows={7}
            maxLength={1000}
            onChange={(event) => updateDraft("invitationText", event.target.value)}
          />
        </label>
      ) : null}

      {selectedBlock === "COUNTDOWN" ? (
        <>
          <TextField label="Заголовок таймера" value={draft.countdownTitle} onChange={(value) => updateDraft("countdownTitle", value)} />
          <TextField label="Время начала" type="time" value={draft.ceremonyTime} onChange={(value) => updateDraft("ceremonyTime", value)} />
          <ModuleToggle module="COUNTDOWN" draft={draft} toggleModule={toggleModule} />
        </>
      ) : null}

      {selectedBlock === "MAP" ? (
        <>
          <TextField label="Название площадки" value={draft.venueName} onChange={(value) => updateDraft("venueName", value)} />
          <TextField label="Адрес" value={draft.venueAddress} onChange={(value) => updateDraft("venueAddress", value)} />
          <ModuleToggle module="MAP" draft={draft} toggleModule={toggleModule} />
        </>
      ) : null}

      {selectedBlock === "TRANSFER" ? (
        <>
          <TextField label="Описание" value={draft.transferDescription} onChange={(value) => updateDraft("transferDescription", value)} />
          <TextField label="Время сбора" type="time" value={draft.transferTime} onChange={(value) => updateDraft("transferTime", value)} />
          <TextField label="Место сбора" value={draft.transferMeetingPoint} onChange={(value) => updateDraft("transferMeetingPoint", value)} />
          <ModuleToggle module="TRANSFER" draft={draft} toggleModule={toggleModule} />
        </>
      ) : null}

      {selectedBlock === "WISHLIST" ? (
        <>
          <label className="visual-field">
            <span>Текст блока подарков</span>
            <textarea
              value={draft.wishlistText}
              rows={4}
              maxLength={500}
              onChange={(event) => updateDraft("wishlistText", event.target.value)}
            />
          </label>
          <label className="visual-check-row">
            <input
              checked={draft.noFlowersEnabled}
              type="checkbox"
              onChange={(event) => updateDraft("noFlowersEnabled", event.target.checked)}
            />
            <span>Показывать просьбу “Без цветов”</span>
          </label>
          <label className="visual-field">
            <span>Текст “Без цветов”</span>
            <textarea
              value={draft.noFlowersText}
              rows={4}
              maxLength={700}
              onChange={(event) => updateDraft("noFlowersText", event.target.value)}
            />
          </label>
        </>
      ) : null}

      {selectedBlock === "COORDINATOR" ? (
        <>
          <TextField label="Имя координатора" value={draft.coordinatorName} onChange={(value) => updateDraft("coordinatorName", value)} />
          <TextField label="Роль" value={draft.coordinatorRole} onChange={(value) => updateDraft("coordinatorRole", value)} />
          <TextField label="Телефон" value={draft.coordinatorPhone} onChange={(value) => updateDraft("coordinatorPhone", value)} />
        </>
      ) : null}

      {selectedBlock === "POST_WEDDING" ? (
        <>
          <label className="visual-field">
            <span>Текст благодарности</span>
            <textarea
              value={draft.postWeddingThankYouText}
              rows={5}
              maxLength={1200}
              onChange={(event) => updateDraft("postWeddingThankYouText", event.target.value)}
            />
          </label>
          <TextField label="Ссылка на готовые фото" value={draft.postWeddingPhotoUrl} onChange={(value) => updateDraft("postWeddingPhotoUrl", value)} />
        </>
      ) : null}

      {selectedBlock === "TIMELINE" ? <ModuleToggle module="TIMELINE" draft={draft} toggleModule={toggleModule} /> : null}
      {selectedBlock === "DRESS_CODE" ? <ModuleToggle module="DRESS_CODE" draft={draft} toggleModule={toggleModule} /> : null}
      {selectedBlock === "RSVP" ? <ModuleToggle module="RSVP" draft={draft} toggleModule={toggleModule} /> : null}

      {selectedBlock === "FAQ" || selectedBlock === "GALLERY" ? (
        <p className="visual-muted-note">
          Этот блок пока редактируется в основном конструкторе. Визуальный редактор уже умеет выбрать его, подсветить и сохранить общий стиль сайта.
        </p>
      ) : null}

      <StyleEditor draft={draft} designThemes={designThemes} updateDraft={updateDraft} />
      <BlockOrderEditor draft={draft} selectedBlock={selectedBlock} moveBlock={moveBlock} allBlocks={allBlocks} />
    </section>
  );
}

function StyleEditor({
  draft,
  designThemes,
  updateDraft,
}: {
  draft: VisualEditorDraft;
  designThemes: DesignThemeOption[];
  updateDraft: <Key extends keyof VisualEditorDraft>(
    key: Key,
    value: VisualEditorDraft[Key],
  ) => void;
}) {
  return (
    <div className="visual-subpanel">
      <strong>Общий стиль</strong>
      <label className="visual-field">
        <span>Тема</span>
        <select
          value={draft.designThemeId ?? ""}
          onChange={(event) => updateDraft("designThemeId", event.target.value || null)}
        >
          <option value="">Без темы</option>
          {designThemes.map((theme) => (
            <option key={theme.id} value={theme.id}>{theme.name}</option>
          ))}
        </select>
      </label>
      <label className="visual-field">
        <span>Шрифт</span>
        <select
          value={draft.fontCode}
          onChange={(event) => updateDraft("fontCode", event.target.value as FontCode)}
        >
          {fontCodes.map((font) => (
            <option key={font} value={font}>{fontLabels[font]}</option>
          ))}
        </select>
      </label>
      <label className="visual-field">
        <span>Карточки</span>
        <select
          value={draft.cardStyle}
          onChange={(event) => updateDraft("cardStyle", event.target.value as CardStyleCode)}
        >
          {cardStyleCodes.map((style) => (
            <option key={style} value={style}>{cardStyleLabels[style]}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

function ModuleToggle({
  module,
  draft,
  toggleModule,
}: {
  module: BuilderModule;
  draft: VisualEditorDraft;
  toggleModule: (module: BuilderModule) => void;
}) {
  return (
    <button
      className={`visual-module-toggle ${draft.moduleVisibility[module] ? "is-on" : ""}`}
      type="button"
      onClick={() => toggleModule(module)}
    >
      <span>{moduleLabels[module]}</span>
      <i>{draft.moduleVisibility[module] ? "Включен" : "Скрыт"}</i>
    </button>
  );
}

function BlockOrderEditor({
  draft,
  selectedBlock,
  moveBlock,
  allBlocks,
}: {
  draft: VisualEditorDraft;
  selectedBlock: VisualBlockCode;
  moveBlock: (block: ContentBlockCode, direction: -1 | 1) => void;
  allBlocks: ContentBlockCode[];
}) {
  if (!allBlocks.includes(selectedBlock as ContentBlockCode)) return null;

  const block = selectedBlock as ContentBlockCode;
  const index = draft.blockOrder.indexOf(block);

  return (
    <div className="visual-subpanel">
      <strong>Порядок блока</strong>
      <div className="visual-order-buttons">
        <button type="button" disabled={index <= 0} onClick={() => moveBlock(block, -1)}>
          <ArrowUp size={14} /> Выше
        </button>
        <button type="button" disabled={index < 0 || index >= allBlocks.length - 1} onClick={() => moveBlock(block, 1)}>
          <ArrowDown size={14} /> Ниже
        </button>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="visual-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
