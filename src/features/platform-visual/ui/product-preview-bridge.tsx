"use client";

import { useEffect } from "react";

import type { ProductVisualConfig, ProductVisualSection } from "@/features/platform-visual/config";

type ProductScreen = "landing" | "quiz" | "constructor";

type ProductEditorMessage =
  | {
      type: "VOWLY_PRODUCT_SELECT_SECTION";
      screen: ProductScreen;
      sectionId: string;
    }
  | {
      type: "VOWLY_PRODUCT_EDIT_FIELD";
      field: string;
      value: string;
    }
  | {
      type: "VOWLY_PRODUCT_SELECT_FIELD";
      field: string;
    }
  | {
      type: "VOWLY_PRODUCT_MOVE_SECTION";
      screen: ProductScreen;
      sourceId: string;
      targetId: string;
    }
  | {
      type: "VOWLY_PRODUCT_APPLY_CONFIG";
      config: ProductVisualConfig;
    };

const sectionClassPrefixes = [
  "product-section-size-",
  "product-section-align-",
  "product-section-text-",
  "product-section-density-",
  "product-section-button-",
  "product-section-width-",
  "product-section-text-scale-",
];

function fieldValue(config: ProductVisualConfig, field: string) {
  const values: Record<string, string> = {
    "landing.badge": config.landing.badge,
    "landing.title": config.landing.title,
    "landing.subtitle": config.landing.subtitle,
    "landing.primaryCta": config.landing.primaryCta,
    "landing.secondaryCta": config.landing.secondaryCta,
    "landing.mockupCouple": config.landing.mockupCouple,
    "landing.mockupDate": config.landing.mockupDate,
    "quiz.badge": config.quiz.badge,
    "quiz.stepOneTitle": config.quiz.stepOneTitle,
    "quiz.stepOneDescription": config.quiz.stepOneDescription,
    "quiz.styleTitle": config.quiz.styleTitle,
    "quiz.styleDescription": config.quiz.styleDescription,
    "quiz.featuresTitle": config.quiz.featuresTitle,
    "quiz.featuresDescription": config.quiz.featuresDescription,
    "quiz.finalTitle": config.quiz.finalTitle,
    "quiz.finalDescription": config.quiz.finalDescription,
    "constructor.assistantTitle": config.constructor.assistantTitle,
    "constructor.assistantDescription": config.constructor.assistantDescription,
    "constructor.publishButtonText": config.constructor.publishButtonText,
    "constructor.previewButtonText": config.constructor.previewButtonText,
  };

  return values[field];
}

function applySection(sectionElement: HTMLElement, section: ProductVisualSection) {
  sectionElement.style.order = String(section.order);
  sectionElement.style.display = section.enabled ? "" : "none";
  sectionElement.style.setProperty("--product-section-offset-x", `${section.offsetX}px`);
  sectionElement.style.setProperty("--product-section-offset-y", `${section.offsetY}px`);

  sectionClassPrefixes.forEach((prefix) => {
    [...sectionElement.classList]
      .filter((className) => className.startsWith(prefix))
      .forEach((className) => sectionElement.classList.remove(className));
  });

  sectionElement.classList.add(
    `product-section-size-${section.size}`,
    `product-section-align-${section.align}`,
    `product-section-text-${section.textAlign}`,
    `product-section-density-${section.density}`,
    `product-section-button-${section.buttonSize}`,
    `product-section-width-${section.blockWidth}`,
    `product-section-text-scale-${section.textScale}`,
  );
}

function applyFieldStyle(fieldElement: HTMLElement, config: ProductVisualConfig) {
  const field = fieldElement.dataset.productField;
  const style = field ? config.fieldStyles[field] : undefined;

  fieldElement.style.display = "inline-block";
  fieldElement.style.transform = style
    ? `translate(${style.offsetX}px, ${style.offsetY}px)`
    : "";
  fieldElement.style.color = style?.color || "";
  fieldElement.style.fontSize = style ? `${style.fontSize}%` : "";
  fieldElement.style.fontWeight =
    style?.fontWeight === "bold"
      ? "850"
      : style?.fontWeight === "medium"
        ? "650"
        : "";
  fieldElement.style.letterSpacing = style ? `${style.letterSpacing / 100}em` : "";
  fieldElement.style.textAlign = style?.textAlign || "";
}

export function ProductPreviewBridge({ screen }: { screen: ProductScreen }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("adminPreview")) return;

    document.documentElement.classList.add("product-preview-editing");

    let draggedSectionId = "";

    const postToParent = (message: ProductEditorMessage) => {
      window.parent.postMessage(message, window.location.origin);
    };

    const applyConfig = (config: ProductVisualConfig) => {
      const root = document.documentElement;
      root.style.setProperty("--product-bg", config.appearance.backgroundColor);
      root.style.setProperty("--product-surface", config.appearance.surfaceColor);
      root.style.setProperty("--product-text", config.appearance.textColor);
      root.style.setProperty("--product-accent", config.appearance.accentColor);
      root.classList.remove(
        "product-font-compact",
        "product-font-normal",
        "product-font-large",
        "product-radius-soft",
        "product-radius-rounded",
        "product-radius-pill",
      );
      root.classList.add(
        `product-font-${config.appearance.fontScale}`,
        `product-radius-${config.appearance.radius}`,
      );

      document.querySelectorAll<HTMLElement>("[data-product-field]").forEach((field) => {
        const value = field.dataset.productField
          ? fieldValue(config, field.dataset.productField)
          : undefined;
        if (typeof value === "string" && document.activeElement !== field) {
          field.textContent = value;
        }
        applyFieldStyle(field, config);
      });

      config[screen].sections.forEach((section) => {
        document
          .querySelectorAll<HTMLElement>(`[data-product-section="${section.id}"]`)
          .forEach((sectionElement) => applySection(sectionElement, section));
      });
    };

    const selectSection = (section: HTMLElement) => {
      document
        .querySelectorAll(".product-preview-selected")
        .forEach((element) => element.classList.remove("product-preview-selected"));
      section.classList.add("product-preview-selected");
      postToParent({
        type: "VOWLY_PRODUCT_SELECT_SECTION",
        screen,
        sectionId: section.dataset.productSection ?? "",
      });
    };

    const selectField = (field: HTMLElement) => {
      document
        .querySelectorAll(".product-preview-field-selected")
        .forEach((element) =>
          element.classList.remove("product-preview-field-selected"),
        );
      field.classList.add("product-preview-field-selected");
      postToParent({
        type: "VOWLY_PRODUCT_SELECT_FIELD",
        field: field.dataset.productField ?? "",
      });
    };

    document.querySelectorAll<HTMLElement>("[data-product-section]").forEach((section) => {
      section.setAttribute("draggable", "true");
      section.setAttribute("title", "Кликните, чтобы выбрать. Перетащите, чтобы поменять порядок.");
    });

    document.querySelectorAll<HTMLElement>("[data-product-field]").forEach((field) => {
      field.setAttribute("contenteditable", "true");
      field.setAttribute("spellcheck", "false");
      field.setAttribute("title", "Редактируйте текст прямо здесь");
    });

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const field = target?.closest<HTMLElement>("[data-product-field]");
      const section = target?.closest<HTMLElement>("[data-product-section]");

      if (!section) return;

      if (target?.closest("a, button")) {
        event.preventDefault();
      }

      selectSection(section);

      if (field) {
        selectField(field);
        field.focus();
      }
    };

    const handleInput = (event: Event) => {
      const field = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-product-field]",
      );
      if (!field?.dataset.productField) return;

      postToParent({
        type: "VOWLY_PRODUCT_EDIT_FIELD",
        field: field.dataset.productField,
        value: field.textContent?.trim() ?? "",
      });
    };

    const handleDragStart = (event: DragEvent) => {
      const section = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-product-section]",
      );
      if (!section?.dataset.productSection) return;
      draggedSectionId = section.dataset.productSection;
      event.dataTransfer?.setData("text/plain", draggedSectionId);
      event.dataTransfer?.setDragImage(section, 24, 24);
    };

    const handleDragOver = (event: DragEvent) => {
      if (!draggedSectionId) return;
      const section = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-product-section]",
      );
      if (!section) return;
      event.preventDefault();
    };

    const handleDrop = (event: DragEvent) => {
      const section = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-product-section]",
      );
      const targetId = section?.dataset.productSection;
      const sourceId = draggedSectionId || event.dataTransfer?.getData("text/plain") || "";
      draggedSectionId = "";

      if (!sourceId || !targetId || sourceId === targetId) return;
      event.preventDefault();
      postToParent({
        type: "VOWLY_PRODUCT_MOVE_SECTION",
        screen,
        sourceId,
        targetId,
      });
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "VOWLY_PRODUCT_APPLY_CONFIG") return;
      applyConfig(event.data.config as ProductVisualConfig);
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("input", handleInput, true);
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("dragover", handleDragOver, true);
    document.addEventListener("drop", handleDrop, true);
    window.addEventListener("message", handleMessage);

    return () => {
      document.documentElement.classList.remove("product-preview-editing");
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("dragover", handleDragOver, true);
      document.removeEventListener("drop", handleDrop, true);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}
