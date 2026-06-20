import { prisma } from "@/lib/prisma";

export const productVisualSettingKey = "PRODUCT_VISUAL_CONFIG";

export type ProductVisualSection = {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  size: "compact" | "normal" | "large";
  align: "left" | "center" | "right";
  textAlign: "left" | "center" | "right";
  density: "tight" | "normal" | "airy";
  buttonSize: "small" | "normal" | "large";
};

export type ProductVisualConfig = {
  landing: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    mockupCouple: string;
    mockupDate: string;
    sections: ProductVisualSection[];
  };
  quiz: {
    badge: string;
    stepOneTitle: string;
    stepOneDescription: string;
    styleTitle: string;
    styleDescription: string;
    featuresTitle: string;
    featuresDescription: string;
    finalTitle: string;
    finalDescription: string;
    sections: ProductVisualSection[];
  };
  constructor: {
    assistantTitle: string;
    assistantDescription: string;
    publishButtonText: string;
    previewButtonText: string;
    sections: ProductVisualSection[];
  };
};

export const defaultProductVisualConfig: ProductVisualConfig = {
  landing: {
    badge: "Vowly wedding atelier",
    title: "Свадебный сайт с ощущением дорогой полиграфии",
    subtitle:
      "Приглашение, анкета гостей, карта, музыка и тайминг собираются в цельный digital-формат: спокойно, красиво и без ручной рутины.",
    primaryCta: "Начать создание",
    secondaryCta: "Посмотреть возможности",
    mockupCouple: "Александр & Валентина",
    mockupDate: "20 июня 2026",
    sections: [
      createSection("hero", "Первый экран", 1, "large", "left", "left", "airy", "normal"),
      createSection("stats", "Короткие факты", 2, "normal", "center", "center", "normal", "normal"),
      createSection("how", "Как это работает", 3, "normal", "center", "center", "normal", "normal"),
      createSection("features", "Возможности", 4, "normal", "center", "center", "normal", "normal"),
      createSection("designs", "Стили", 5, "normal", "left", "left", "normal", "normal"),
      createSection("after", "После свадьбы", 6, "normal", "left", "left", "normal", "normal"),
      createSection("faq", "FAQ", 7, "compact", "center", "center", "tight", "normal"),
      createSection("final", "Финальный CTA", 8, "normal", "center", "center", "normal", "normal"),
    ],
  },
  quiz: {
    badge: "Свадебный ассистент",
    stepOneTitle: "Начнем с основы",
    stepOneDescription:
      "Мне нужны только имена, дата и время. Остальное спокойно настроим потом.",
    styleTitle: "Какой стиль ближе?",
    styleDescription:
      "Здесь показываются стили из админки. Вы сможете добавлять новые и менять их без кода.",
    featuresTitle: "Есть что-то особенное?",
    featuresDescription:
      "Отметьте только то, что действительно влияет на сценарий. Если сомневаетесь — просто идем дальше.",
    finalTitle: "Собираю ваш сайт",
    finalDescription:
      "Основа готова. В конструкторе вы сможете добавить фото, музыку, гостей, карту и тексты.",
    sections: [
      createSection("basis", "Основа", 1, "large", "center", "center", "normal", "normal"),
      createSection("style", "Стиль", 2, "normal", "center", "center", "normal", "normal"),
      createSection("features", "Особенности", 3, "normal", "center", "center", "normal", "normal"),
      createSection("summary", "Финал", 4, "normal", "center", "center", "normal", "large"),
    ],
  },
  constructor: {
    assistantTitle: "Свадебный ассистент",
    assistantDescription: "Ведем пару по шагам, чтобы сайт собирался без хаоса.",
    publishButtonText: "Оживить сайт",
    previewButtonText: "Предпросмотр",
    sections: [
      createSection("content", "Сайт", 1, "large", "left", "left", "normal", "normal"),
      createSection("styles", "Стиль", 2, "normal", "left", "left", "normal", "normal"),
      createSection("media", "Фото", 3, "normal", "left", "left", "normal", "normal"),
      createSection("music", "Музыка", 4, "compact", "left", "left", "tight", "normal"),
      createSection("guests", "Гости", 5, "normal", "left", "left", "normal", "normal"),
      createSection("after", "После", 6, "compact", "left", "left", "tight", "normal"),
      createSection("publish", "Запуск", 7, "large", "left", "left", "normal", "large"),
    ],
  },
};

function createSection(
  id: string,
  label: string,
  order: number,
  size: ProductVisualSection["size"],
  align: ProductVisualSection["align"],
  textAlign: ProductVisualSection["textAlign"],
  density: ProductVisualSection["density"],
  buttonSize: ProductVisualSection["buttonSize"],
): ProductVisualSection {
  return {
    id,
    label,
    enabled: true,
    order,
    size,
    align,
    textAlign,
    density,
    buttonSize,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeSections(
  defaults: ProductVisualSection[],
  incoming: unknown,
): ProductVisualSection[] {
  if (!Array.isArray(incoming)) return defaults;

  return defaults.map((section) => {
    const found = incoming.find(
      (item) => isPlainObject(item) && item.id === section.id,
    );
    if (!isPlainObject(found)) return section;

    return {
      ...section,
      label: typeof found.label === "string" ? found.label : section.label,
      enabled: typeof found.enabled === "boolean" ? found.enabled : section.enabled,
      order: typeof found.order === "number" ? found.order : section.order,
      size:
        found.size === "compact" || found.size === "normal" || found.size === "large"
          ? found.size
          : section.size,
      align:
        found.align === "left" || found.align === "center" || found.align === "right"
          ? found.align
          : section.align,
      textAlign:
        found.textAlign === "left" ||
        found.textAlign === "center" ||
        found.textAlign === "right"
          ? found.textAlign
          : section.textAlign,
      density:
        found.density === "tight" ||
        found.density === "normal" ||
        found.density === "airy"
          ? found.density
          : section.density,
      buttonSize:
        found.buttonSize === "small" ||
        found.buttonSize === "normal" ||
        found.buttonSize === "large"
          ? found.buttonSize
          : section.buttonSize,
    };
  });
}

export function parseProductVisualConfig(value: string | null | undefined) {
  if (!value) return defaultProductVisualConfig;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isPlainObject(parsed)) return defaultProductVisualConfig;

    const landing: Record<string, unknown> = isPlainObject(parsed.landing)
      ? parsed.landing
      : {};
    const quiz: Record<string, unknown> = isPlainObject(parsed.quiz)
      ? parsed.quiz
      : {};
    const constructorConfig: Record<string, unknown> = isPlainObject(
      parsed.constructor,
    )
      ? parsed.constructor
      : {};

    return {
      landing: {
        ...defaultProductVisualConfig.landing,
        ...landing,
        sections: mergeSections(defaultProductVisualConfig.landing.sections, landing.sections),
      },
      quiz: {
        ...defaultProductVisualConfig.quiz,
        ...quiz,
        sections: mergeSections(defaultProductVisualConfig.quiz.sections, quiz.sections),
      },
      constructor: {
        ...defaultProductVisualConfig.constructor,
        ...constructorConfig,
        sections: mergeSections(
          defaultProductVisualConfig.constructor.sections,
          constructorConfig.sections,
        ),
      },
    } satisfies ProductVisualConfig;
  } catch {
    return defaultProductVisualConfig;
  }
}

export async function getProductVisualConfig() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: productVisualSettingKey },
    select: { value: true },
  });

  return parseProductVisualConfig(setting?.value);
}
