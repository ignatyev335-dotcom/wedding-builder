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
  templateStyle: string;
  designThemeId: string;
  musicTrackId: string;
  invitationTemplateId: string;
  audioUrl: string;
  modules: OptionalModule[];
  needsTransfer: boolean;
  strictDressCode: boolean;
  privateWedding: boolean;
  multilingualInvitation: boolean;
  postWeddingAutoEnabled: boolean;
  personalLinks: boolean;
  acceptedTerms: boolean;
};

export type AudioTrackOption = {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
};

export type InvitationTemplateOption = {
  id: string;
  title: string;
  category: string;
  content: string;
};

export type DesignThemeOption = {
  id: string;
  name: string;
  backgroundColor: string;
  primaryColor: string;
  textColor: string;
  gradientCss?: string | null;
  fontFamily: string;
  customFont?: CustomFontOption | null;
};

export type MonetizationPlan = "FREE" | "PREMIUM" | "VIP";

export type MonetizationFeatureOption = {
  id: string;
  code: string;
  title: string;
  description: string;
  plan: MonetizationPlan;
  sortOrder: number;
  isActive: boolean;
};

export type CustomFontOption = {
  id: string;
  name: string;
  family: string;
  fileUrl: string;
  format: string;
};

export type MediaAssetOption = {
  id: string;
  name: string;
  type: "ICON" | "STICKER";
  url: string;
};

export type PlatformContentConfig = {
  greetingEnabled: boolean;
  timelineEnabled: boolean;
  dressCodeEnabled: boolean;
  mapEnabled: boolean;
  rsvpEnabled: boolean;
  primaryButtonText: string;
  footerText: string;
  errorText: string;
};

export type BuilderModule = OptionalModule;

export const fontCodes = [
  "CORMORANT",
  "ORANIENBAUM",
  "MARCK",
  "CAVEAT",
  "BAD_SCRIPT",
  "PLAYFAIR",
  "MONTSERRAT",
] as const;
export type FontCode = (typeof fontCodes)[number];

export const countdownStyleCodes = ["MINIMAL", "TILES", "FLIP"] as const;
export type CountdownStyleCode = (typeof countdownStyleCodes)[number];

export const contentBlockCodes = [
  "COUNTDOWN",
  "TIMELINE",
  "DRESS_CODE",
  "MAP",
  "TRANSFER",
  "WISHLIST",
  "COORDINATOR",
  "FAQ",
  "RSVP",
] as const;
export type ContentBlockCode = (typeof contentBlockCodes)[number];

export type TimelineEvent = {
  id: string;
  time: string;
  title: string;
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

export const alcoholPreferenceCodes = [
  "WINE",
  "CHAMPAGNE",
  "STRONG",
  "NONE",
] as const;
export type AlcoholPreferenceCode = (typeof alcoholPreferenceCodes)[number];

export const transportPreferenceCodes = [
  "TRANSFER",
  "OWN_CAR",
  "SELF",
] as const;
export type TransportPreferenceCode =
  (typeof transportPreferenceCodes)[number];

export const guestTagCodes = ["FAMILY", "FRIENDS", "COLLEAGUES"] as const;
export type GuestTagCode = (typeof guestTagCodes)[number];

export const coupleAttendanceCodes = [
  "BOTH",
  "PRIMARY",
  "PARTNER",
  "NONE",
] as const;
export type CoupleAttendanceCode = (typeof coupleAttendanceCodes)[number];

export type CustomQuestion = {
  id: string;
  title: string;
  type: "TEXT" | "OPTIONS";
  options: string[];
};

export type RsvpQuestionKey =
  | "plusOne"
  | "food"
  | "alcohol"
  | "transport"
  | "music";

export type GuestResponse = {
  id: string;
  name: string;
  phone: string;
  status: GuestStatus;
  magicToken: string | null;
  invitationUrl: string | null;
  dietaryRestrictions: string;
  foodPreference: string;
  partnerFoodPreference: string;
  allergies: string;
  partnerAllergies: string;
  drinks: string;
  alcoholPreferences: AlcoholPreferenceCode[];
  needsTransport: boolean;
  transportPreference: TransportPreferenceCode | null;
  hasPlusOne: boolean;
  plusOneName: string;
  musicRequest: string;
  isCouple: boolean;
  partnerName: string;
  attendanceChoice: CoupleAttendanceCode | null;
  tags: GuestTagCode[];
  customAnswers: Record<string, string>;
  respondedAt: string;
};

export type PersonalizedGuest = Pick<
  GuestResponse,
  "id" | "name" | "status" | "isCouple" | "partnerName"
> & {
  magicToken: string;
};

export type WishlistItem = {
  id: string;
  title: string;
  url: string;
  type: "ITEM" | "EXPERIENCE";
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const photoMaskCodes = ["RECTANGLE", "ARCH", "OVAL"] as const;
export type PhotoMaskCode = (typeof photoMaskCodes)[number];

export const cardStyleCodes = [
  "PLAIN",
  "ROUNDED",
  "SHARP",
  "GLASS",
  "LIQUID",
  "FLOATING",
  "AURORA",
  "EDITORIAL",
  "SILK",
  "MONOGRAM",
] as const;
export type CardStyleCode = (typeof cardStyleCodes)[number];

export const languageCodes = ["RU", "EN", "ZH"] as const;
export type LanguageCode = (typeof languageCodes)[number];

export type CrewTimingItem = {
  id: string;
  time: string;
  description: string;
  contactPerson: string;
};

export const packageCodes = ["BASIC", "INTERACTIVE", "PREMIUM"] as const;
export type PackageCode = (typeof packageCodes)[number];

export type WeddingBuilderData = {
  siteId?: string;
  slug?: string;
  isPremium: boolean;
  removeBranding: boolean;
  partnerOneName: string;
  partnerTwoName: string;
  weddingDate: string;
  ceremonyTime: string;
  venueName: string;
  venueAddress: string;
  mapLatitude: number | null;
  mapLongitude: number | null;
  currentTheme: ThemeCode;
  designTheme: DesignThemeOption | null;
  decorativeAsset: MediaAssetOption | null;
  platformContent: PlatformContentConfig;
  fontCode: FontCode;
  customFont: CustomFontOption | null;
  blockOrder: ContentBlockCode[];
  moduleVisibility: Record<BuilderModule, boolean>;
  musicTrack: string | null;
  musicTrackUrl: string | null;
  musicTrackTitle: string | null;
  customMusicDataUrl: string | null;
  customMusicName: string | null;
  countdownTitle: string;
  countdownStyle: CountdownStyleCode;
  timelineEvents: TimelineEvent[];
  colorPalette: string[];
  premiumFeatures: Record<PremiumFeatureCode, boolean>;
  selectedPackage: PackageCode;
  telegramProfile: TelegramProfile;
  guests: GuestResponse[];
  heroImageDesktop: string | null;
  heroImageMobile: string | null;
  coverPhoto: string | null;
  galleryPhotos: string[];
  dressMoodboard: string[];
  faqItems: FaqItem[];
  giftPaymentLink: string;
  giftQrCode: string | null;
  coordinatorName: string;
  coordinatorRole: string;
  coordinatorPhoto: string | null;
  coordinatorTelegram: string;
  coordinatorWhatsapp: string;
  coordinatorPhone: string;
  coordinatorMapLink: string;
  photoMask: PhotoMaskCode;
  cardStyle: CardStyleCode;
  pinCode: string;
  isPrivate: boolean;
  language: LanguageCode;
  crewTimings: CrewTimingItem[];
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
  rsvpQuestionSettings: Record<RsvpQuestionKey, boolean>;
  customQuestions: CustomQuestion[];
};
