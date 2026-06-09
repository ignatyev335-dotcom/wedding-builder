import {
  contentBlockCodes,
  fontCodes,
  type ContentBlockCode,
  type FontCode,
  type WishlistItem,
} from "@/entities/wedding/model";

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
  postWeddingPhotoUrl: string;
  fontCode: FontCode;
  blockOrder: ContentBlockCode[];
};

export const defaultSiteExtras: SiteExtras = {
  coverPhoto: null,
  galleryPhotos: [],
  invitationText:
    "Совсем скоро состоится день, который станет началом нашей семейной истории. Будем счастливы разделить его с вами.",
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
  postWeddingPhotoUrl: "",
  fontCode: "PLAYFAIR",
  blockOrder: [...contentBlockCodes],
};

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
        typeof parsed.postWeddingMode === "boolean"
          ? parsed.postWeddingMode
          : false,
      postWeddingPhotoUrl:
        typeof parsed.postWeddingPhotoUrl === "string"
          ? parsed.postWeddingPhotoUrl
          : "",
      fontCode: fontCodes.includes(parsed.fontCode as FontCode)
        ? (parsed.fontCode as FontCode)
        : "PLAYFAIR",
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
    };
  } catch {
    return defaultSiteExtras;
  }
}
