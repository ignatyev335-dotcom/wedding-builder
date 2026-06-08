export const themeCodes = ["MINIMAL", "BOHO", "CLASSIC", "MODERN"] as const;
export type ThemeCode = (typeof themeCodes)[number];

export const optionalModules = [
  "RSVP",
  "DRESS_CODE",
  "TIMELINE",
  "TRANSFER",
  "MAP",
] as const;
export type OptionalModule = (typeof optionalModules)[number];

export type QuizDraft = {
  partnerOneName: string;
  partnerTwoName: string;
  weddingDate: string;
  theme: ThemeCode;
  modules: OptionalModule[];
  acceptedTerms: boolean;
};

export type BuilderModule = OptionalModule;

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

export const guestStatuses = ["PENDING", "ATTENDING", "NOT_ATTENDING"] as const;
export type GuestStatus = (typeof guestStatuses)[number];

export type GuestResponse = {
  id: string;
  name: string;
  status: GuestStatus;
  dietaryRestrictions: string;
  drinks: string;
  needsTransport: boolean;
  respondedAt: string;
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
  currentTheme: ThemeCode;
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
  postWeddingMode: boolean;
};
