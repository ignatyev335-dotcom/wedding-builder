import type { WishlistItem } from "@/entities/wedding/model";

export type SiteExtras = {
  coverPhoto: string | null;
  galleryPhotos: string[];
  invitationText: string;
  wishlistText: string;
  wishlistItems: WishlistItem[];
  postWeddingMode: boolean;
};

export const defaultSiteExtras: SiteExtras = {
  coverPhoto: null,
  galleryPhotos: [],
  invitationText:
    "Совсем скоро состоится день, который станет началом нашей семейной истории. Будем счастливы разделить его с вами.",
  wishlistText: "Лучший подарок для нас — вклад в нашу семейную мечту.",
  wishlistItems: [],
  postWeddingMode: false,
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
          )
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
            .slice(0, 3)
        : [],
      postWeddingMode:
        typeof parsed.postWeddingMode === "boolean"
          ? parsed.postWeddingMode
          : false,
    };
  } catch {
    return defaultSiteExtras;
  }
}
