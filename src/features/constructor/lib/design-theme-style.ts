import type { CSSProperties } from "react";

import type { DesignThemeOption } from "@/entities/wedding/model";

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
): ThemeCssProperties | undefined {
  if (!theme) return undefined;

  const font = fontStacks[theme.fontFamily] ?? fontStacks.PLAYFAIR;

  return {
    color: theme.textColor,
    background: theme.backgroundColor,
    "--theme-bg": theme.backgroundColor,
    "--theme-surface": `color-mix(in srgb, ${theme.backgroundColor} 88%, ${theme.textColor})`,
    "--theme-text": theme.textColor,
    "--theme-muted": `color-mix(in srgb, ${theme.textColor} 62%, transparent)`,
    "--theme-accent": theme.primaryColor,
    "--theme-body": font,
    "--theme-display": font,
    "--selected-font": font,
  };
}
