import { prisma } from "@/lib/prisma";

export const productVisualSettingKey = "PRODUCT_VISUAL_CONFIG";

export type ProductVisualSection = {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  size: "compact" | "normal" | "large";
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
      { id: "hero", label: "Первый экран", enabled: true, order: 1, size: "large" },
      { id: "stats", label: "Короткие факты", enabled: true, order: 2, size: "normal" },
      { id: "how", label: "Как это работает", enabled: true, order: 3, size: "normal" },
      { id: "features", label: "Возможности", enabled: true, order: 4, size: "normal" },
      { id: "designs", label: "Стили", enabled: true, order: 5, size: "normal" },
      { id: "after", label: "После свадьбы", enabled: true, order: 6, size: "normal" },
      { id: "faq", label: "FAQ", enabled: true, order: 7, size: "compact" },
      { id: "final", label: "Финальный CTA", enabled: true, order: 8, size: "normal" },
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
      { id: "basis", label: "Основа", enabled: true, order: 1, size: "large" },
      { id: "style", label: "Стиль", enabled: true, order: 2, size: "normal" },
      { id: "features", label: "Особенности", enabled: true, order: 3, size: "normal" },
      { id: "summary", label: "Финал", enabled: true, order: 4, size: "normal" },
    ],
  },
  constructor: {
    assistantTitle: "Свадебный ассистент",
    assistantDescription: "Ведем пару по шагам, чтобы сайт собирался без хаоса.",
    publishButtonText: "Оживить сайт",
    previewButtonText: "Предпросмотр",
    sections: [
      { id: "content", label: "Сайт", enabled: true, order: 1, size: "large" },
      { id: "styles", label: "Стиль", enabled: true, order: 2, size: "normal" },
      { id: "media", label: "Фото", enabled: true, order: 3, size: "normal" },
      { id: "music", label: "Музыка", enabled: true, order: 4, size: "compact" },
      { id: "guests", label: "Гости", enabled: true, order: 5, size: "normal" },
      { id: "after", label: "После", enabled: true, order: 6, size: "compact" },
      { id: "publish", label: "Запуск", enabled: true, order: 7, size: "large" },
    ],
  },
};

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
