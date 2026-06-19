import type { CSSProperties } from "react";

import type {
  CustomFontOption,
  DesignThemeOption,
} from "@/entities/wedding/model";

const fontStacks: Record<string, string> = {
  CORMORANT: 'var(--font-cormorant), Georgia, serif',
  ORANIENBAUM: 'var(--font-oranienbaum), Georgia, serif',
  MARCK: 'var(--font-marck), cursive',
  CAVEAT: 'var(--font-caveat), cursive',
  BAD_SCRIPT: 'var(--font-bad-script), cursive',
  PLAYFAIR: 'var(--font-playfair), Georgia, serif',
  MONTSERRAT: 'var(--font-montserrat), "Segoe UI", sans-serif',
};

type ThemeCssProperties = CSSProperties & Record<`--${string}`, string>;

export function getDesignThemeStyle(
  theme: DesignThemeOption | null,
  customFont?: CustomFontOption | null,
): ThemeCssProperties | undefined {
  if (!theme && !customFont) return undefined;

  const selectedFont = customFont ?? theme?.customFont ?? null;
  const font = selectedFont
    ? `"${selectedFont.family}", Georgia, serif`
    : (fontStacks[theme?.fontFamily ?? "PLAYFAIR"] ?? fontStacks.PLAYFAIR);
  const backgroundColor = theme?.backgroundColor ?? "#f7f6f2";
  const primaryColor = theme?.primaryColor ?? "#2f3b2f";
  const textColor = theme?.textColor ?? "#20231f";

  return {
    color: textColor,
    background: theme?.gradientCss || backgroundColor,
    backgroundColor,
    backgroundImage: theme?.gradientCss ?? undefined,
    "--theme-bg": backgroundColor,
    "--theme-surface": `color-mix(in srgb, ${backgroundColor} 88%, ${textColor})`,
    "--theme-text": textColor,
    "--theme-muted": `color-mix(in srgb, ${textColor} 62%, transparent)`,
    "--theme-accent": primaryColor,
    "--hero-fade-color": backgroundColor,
    "--theme-body": font,
    "--theme-display": font,
    "--selected-font": font,
  };
}

export function getDesignThemeFontFace(
  theme: DesignThemeOption | null,
  customFont?: CustomFontOption | null,
) {
  const font = customFont ?? theme?.customFont;
  if (!font) return null;

  return `@font-face{font-family:${JSON.stringify(font.family)};src:url(${JSON.stringify(
    font.fileUrl,
  )}) format(${JSON.stringify(font.format)});font-display:swap;font-style:normal;}`;
}
