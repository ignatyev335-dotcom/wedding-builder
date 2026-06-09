export const themeCodes = [
  "MINIMAL",
  "BOHO",
  "CLASSIC",
  "MODERN",
  "ROMANTIC",
  "BOTANICAL",
  "EDITORIAL",
] as const;
export type ThemeCode = (typeof themeCodes)[number];

export const optionalModules = [
  "RSVP",
  "DRESS_CODE",
  "TIMELINE",
  "TRANSFER",
  "MAP",
  "COUNTDOWN",
] as const;
export type OptionalModule = (typeof optionalModules)[number];

export type QuizDraft = {
  partnerOneName: string;
  partnerTwoName: string;
  weddingDate: string;
  ceremonyTime: string;
  theme: ThemeCode;
  modules: OptionalModule[];
  acceptedTerms: boolean;
};

export type BuilderModule = OptionalModule;

export const fontCodes = [
  "GREAT_VIBES",
  "PINYON",
  "ALEX_BRUSH",
  "PLAYFAIR",
  "CORMORANT",
  "MONTSERRAT",
] as const;
export type FontCode = (typeof fontCodes)[number];

export const contentBlockCodes = [
  "COUNTDOWN",
  "TIMELINE",
  "DRESS_CODE",
  "MAP",
  "TRANSFER",
  "WISHLIST",
  "RSVP",
] as const;
export type ContentBlockCode = (typeof contentBlockCodes)[number];

export type TimelineEvent = {
  id: string;
  time: string;
  title: string;
};

export type MusicTrack = {
  id: string;
  title: string;
  category: string;
  url: string;
};

export const premiumFeatureCodes = [
  "PREMIUM_STYLE",
  "RSVP_AUTOMATION",
  "PERSONALIZATION",
  "PREMIUM_MEDIA",
] as const;
export type PremiumFeatureCode = (typeof premiumFeatureCodes)[number];

export type TelegramProfile = {
  telegramId: string;
  chatId: string;
  name: string;
} | null;

export const guestStatuses = ["PENDING", "ACCEPTED", "DECLINED"] as const;
export type GuestStatus = (typeof guestStatuses)[number];

export type GuestResponse = {
  id: string;
  name: string;
  phone: string;
  status: GuestStatus;
  magicToken: string | null;
  invitationUrl: string | null;
  dietaryRestrictions: string;
  foodPreference: string;
  allergies: string;
  drinks: string;
  needsTransport: boolean;
  respondedAt: string;
};

export type PersonalizedGuest = Pick<
  GuestResponse,
  "id" | "name" | "status"
> & {
  magicToken: string;
};

export type WishlistItem = {
  id: string;
  title: string;
  url: string;
};

export const packageCodes = ["BASIC", "INTERACTIVE", "PREMIUM"] as const;
export type PackageCode = (typeof packageCodes)[number];

export type WeddingBuilderData = {
  siteId?: string;
  slug?: string;
  partnerOneName: string;
  partnerTwoName: string;
  weddingDate: string;
  ceremonyTime: string;
  venueName: string;
  venueAddress: string;
  mapLatitude: number | null;
  mapLongitude: number | null;
  currentTheme: ThemeCode;
  fontCode: FontCode;
  blockOrder: ContentBlockCode[];
  moduleVisibility: Record<BuilderModule, boolean>;
  musicTrack: string | null;
  timelineEvents: TimelineEvent[];
  colorPalette: string[];
  premiumFeatures: Record<PremiumFeatureCode, boolean>;
  selectedPackage: PackageCode;
  telegramProfile: TelegramProfile;
  guests: GuestResponse[];
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
};
