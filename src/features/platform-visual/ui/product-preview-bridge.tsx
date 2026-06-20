"use client";

import { useEffect } from "react";

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
      type: "VOWLY_PRODUCT_MOVE_SECTION";
      screen: ProductScreen;
      sourceId: string;
      targetId: string;
    };

export function ProductPreviewBridge({ screen }: { screen: ProductScreen }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("adminPreview")) return;

    document.documentElement.classList.add("product-preview-editing");

    let draggedSectionId = "";

    const postToParent = (message: ProductEditorMessage) => {
      window.parent.postMessage(message, window.location.origin);
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

    document.addEventListener("click", handleClick, true);
    document.addEventListener("input", handleInput, true);
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("dragover", handleDragOver, true);
    document.addEventListener("drop", handleDrop, true);

    return () => {
      document.documentElement.classList.remove("product-preview-editing");
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("dragover", handleDragOver, true);
      document.removeEventListener("drop", handleDrop, true);
    };
  }, []);

  return null;
}
