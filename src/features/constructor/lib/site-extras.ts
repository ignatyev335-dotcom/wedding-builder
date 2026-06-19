import {
  contentBlockCodes,
  countdownStyleCodes,
  cardStyleCodes,
  fontCodes,
  type CardStyleCode,
  type ContentBlockCode,
  type CountdownStyleCode,
  type CustomQuestion,
  type CustomFontOption,
  type FontCode,
  type FaqItem,
  type RsvpQuestionKey,
  type WishlistItem,
} from "@/entities/wedding/model";

const defaultRsvpQuestionSettings: Record<RsvpQuestionKey, boolean> = {
  plusOne: true,
  food: true,
  alcohol: true,
  transport: true,
  music: true,
};

export type SiteExtras = {
  coverPhoto: string | null;
  galleryPhotos: string[];
  invitationText: string;
  wishlistText: string;
  wishlistItems: WishlistItem[];
  noFlowersEnabled: boolean;
  noFlowersText: string;
  transferDescription: string;
  transferTime: string;
  transferMeetingPoint: string;
  postWeddingMode: boolean;
  postWeddingAutoEnabled: boolean;
  postWeddingHeroImage: string | null;
  postWeddingPhotoUrl: string;
  postWeddingThankYouText: string;
  fontCode: FontCode;
  customFont: CustomFontOption | null;
  blockOrder: ContentBlockCode[];
  customMusicDataUrl: string | null;
  customMusicName: string | null;
  countdownTitle: string;
  countdownStyle: CountdownStyleCode;
  cardStyle: CardStyleCode;
  rsvpQuestionSettings: Record<RsvpQuestionKey, boolean>;
};

export const defaultSiteExtras: SiteExtras = {
  coverPhoto: null,
  galleryPhotos: [],
  invitationText: "",
  wishlistText: "Лучший подарок для нас — вклад в нашу семейную мечту.",
  wishlistItems: [],
  noFlowersEnabled: false,
  noFlowersText:
    "Пожалуйста, не дарите нам цветы: мы улетаем в путешествие. Будем рады, если вы замените их бутылочкой любимого вина или книгой.",
  transferDescription:
    "Для вашего удобства мы организуем трансфер до площадки и обратно.",
  transferTime: "14:30",
  transferMeetingPoint: "Центр города",
  postWeddingMode: false,
  postWeddingAutoEnabled: false,
  postWeddingHeroImage: null,
  postWeddingPhotoUrl: "",
  postWeddingThankYouText:
    "Спасибо, что разделили с нами этот день. Мы собрали здесь фотографии, к которым хочется возвращаться снова и снова.",
  fontCode: "PLAYFAIR",
  customFont: null,
  blockOrder: [...contentBlockCodes],
  customMusicDataUrl: null,
  customMusicName: null,
  countdownTitle: "До свадьбы осталось",
  countdownStyle: "MINIMAL",
  cardStyle: "PLAIN",
  rsvpQuestionSettings: defaultRsvpQuestionSettings,
};

export function parseFaqItems(value: string | null | undefined): FaqItem[] {
  if (!value) return [];

  try {
    return (JSON.parse(value) as FaqItem[])
      .filter(
        (item) =>
          typeof item?.id === "string" &&
          typeof item?.question === "string" &&
          typeof item?.answer === "string",
      )
      .slice(0, 12);
  } catch {
    return [];
  }
}

export function parseImageList(
  value: string | null | undefined,
  limit: number,
) {
  if (!value) return [];

  try {
    return (JSON.parse(value) as unknown[])
      .filter((item): item is string => typeof item === "string")
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function parseSiteExtras(value: string | null | undefined): SiteExtras {
  if (!value) {
    return defaultSiteExtras;
  }

  try {
    const parsed = JSON.parse(value) as Partial<SiteExtras>;

    return {
      coverPhoto:
        typeof parsed.coverPhoto === "string" ? parsed.coverPhoto : null,
      galleryPhotos: Array.isArray(parsed.galleryPhotos)
        ? parsed.galleryPhotos.filter(
            (photo): photo is string => typeof photo === "string",
          ).slice(0, 30)
        : [],
      invitationText:
        typeof parsed.invitationText === "string"
          ? parsed.invitationText
          : defaultSiteExtras.invitationText,
      wishlistText:
        typeof parsed.wishlistText === "string"
          ? parsed.wishlistText
          : defaultSiteExtras.wishlistText,
      wishlistItems: Array.isArray(parsed.wishlistItems)
        ? parsed.wishlistItems
            .filter(
              (item): item is WishlistItem =>
                typeof item?.id === "string" &&
                typeof item?.title === "string" &&
                typeof item?.url === "string",
            )
            .map((item) => ({
              ...item,
              type: item.type === "EXPERIENCE" ? "EXPERIENCE" as const : "ITEM" as const,
            }))
            .slice(0, 8)
        : [],
      noFlowersEnabled:
        typeof parsed.noFlowersEnabled === "boolean"
          ? parsed.noFlowersEnabled
          : false,
      noFlowersText:
        typeof parsed.noFlowersText === "string"
          ? parsed.noFlowersText
          : defaultSiteExtras.noFlowersText,
      transferDescription:
        typeof parsed.transferDescription === "string"
          ? parsed.transferDescription
          : defaultSiteExtras.transferDescription,
      transferTime:
        typeof parsed.transferTime === "string"
          ? parsed.transferTime
          : defaultSiteExtras.transferTime,
      transferMeetingPoint:
        typeof parsed.transferMeetingPoint === "string"
          ? parsed.transferMeetingPoint
          : defaultSiteExtras.transferMeetingPoint,
      postWeddingMode:
        false,
      postWeddingAutoEnabled:
        typeof parsed.postWeddingAutoEnabled === "boolean"
          ? parsed.postWeddingAutoEnabled
          : false,
      postWeddingHeroImage:
        typeof parsed.postWeddingHeroImage === "string"
          ? parsed.postWeddingHeroImage
          : null,
      postWeddingPhotoUrl:
        typeof parsed.postWeddingPhotoUrl === "string"
          ? parsed.postWeddingPhotoUrl
          : "",
      postWeddingThankYouText:
        typeof parsed.postWeddingThankYouText === "string"
          ? parsed.postWeddingThankYouText
          : defaultSiteExtras.postWeddingThankYouText,
      fontCode: fontCodes.includes(parsed.fontCode as FontCode)
        ? (parsed.fontCode as FontCode)
        : "PLAYFAIR",
      customFont: isCustomFontOption(parsed.customFont)
        ? parsed.customFont
        : null,
      blockOrder: Array.isArray(parsed.blockOrder)
        ? [
            ...parsed.blockOrder.filter(
              (block): block is ContentBlockCode =>
                contentBlockCodes.includes(block as ContentBlockCode),
            ),
            ...contentBlockCodes.filter(
              (block) => !parsed.blockOrder?.includes(block),
            ),
          ]
        : [...contentBlockCodes],
      customMusicDataUrl:
        typeof parsed.customMusicDataUrl === "string"
          ? parsed.customMusicDataUrl
          : null,
      customMusicName:
        typeof parsed.customMusicName === "string"
          ? parsed.customMusicName
          : null,
      countdownTitle:
        typeof parsed.countdownTitle === "string"
          ? parsed.countdownTitle
          : defaultSiteExtras.countdownTitle,
      countdownStyle: countdownStyleCodes.includes(
        parsed.countdownStyle as CountdownStyleCode,
      )
        ? (parsed.countdownStyle as CountdownStyleCode)
        : "MINIMAL",
      cardStyle: cardStyleCodes.includes(parsed.cardStyle as CardStyleCode)
        ? (parsed.cardStyle as CardStyleCode)
        : "PLAIN",
      rsvpQuestionSettings: {
        ...defaultRsvpQuestionSettings,
        ...(typeof parsed.rsvpQuestionSettings === "object" &&
        parsed.rsvpQuestionSettings !== null
          ? parsed.rsvpQuestionSettings
          : {}),
      },
    };
  } catch {
    return defaultSiteExtras;
  }
}

function isCustomFontOption(value: unknown): value is CustomFontOption {
  if (!value || typeof value !== "object") return false;
  const font = value as Partial<CustomFontOption>;
  return (
    typeof font.id === "string" &&
    typeof font.name === "string" &&
    typeof font.family === "string" &&
    typeof font.fileUrl === "string" &&
    typeof font.format === "string"
  );
}

export function parseCustomQuestions(
  value: string | null | undefined,
): CustomQuestion[] {
  if (!value) return [];

  try {
    return (JSON.parse(value) as CustomQuestion[])
      .filter(
        (item) =>
          typeof item?.id === "string" &&
          typeof item?.title === "string" &&
          (item.type === "TEXT" || item.type === "OPTIONS") &&
          Array.isArray(item.options),
      )
      .map((item) => ({
        ...item,
        options: item.options
          .filter((option): option is string => typeof option === "string")
          .slice(0, 6),
      }))
      .slice(0, 5);
  } catch {
    return [];
  }
}
