"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  BuilderModule,
  CardStyleCode,
  ContentBlockCode,
  CountdownStyleCode,
  CrewTimingItem,
  DesignThemeOption,
  FontCode,
  FaqItem,
  GuestResponse,
  PackageCode,
  PhotoMaskCode,
  LanguageCode,
  PremiumFeatureCode,
  TelegramProfile,
  ThemeCode,
  WeddingBuilderData,
  WishlistItem,
} from "@/entities/wedding/model";

type WeddingStore = WeddingBuilderData & {
  initializedSiteId: string | null;
  initialize: (data: WeddingBuilderData) => void;
  setNames: (partnerOneName: string, partnerTwoName: string) => void;
  setWeddingDate: (weddingDate: string) => void;
  setCeremonyTime: (ceremonyTime: string) => void;
  setVenueName: (venueName: string) => void;
  setVenueAddress: (venueAddress: string) => void;
  setMapCoordinates: (
    mapLatitude: number | null,
    mapLongitude: number | null,
  ) => void;
  setCurrentTheme: (theme: ThemeCode) => void;
  setDesignTheme: (theme: DesignThemeOption | null) => void;
  setFontCode: (fontCode: FontCode) => void;
  reorderBlocks: (active: ContentBlockCode, over: ContentBlockCode) => void;
  toggleModule: (module: BuilderModule) => void;
  setMusicTrack: (
    track: { id: string; fileUrl: string; title: string } | null,
  ) => void;
  setCustomMusic: (dataUrl: string | null, name: string | null) => void;
  setCountdownTitle: (countdownTitle: string) => void;
  setCountdownStyle: (countdownStyle: CountdownStyleCode) => void;
  addTimelineEvent: () => void;
  updateTimelineEvent: (
    id: string,
    field: "time" | "title",
    value: string,
  ) => void;
  removeTimelineEvent: (id: string) => void;
  setPaletteColor: (index: number, color: string) => void;
  setColorPalette: (colors: string[]) => void;
  addPaletteColor: () => void;
  removePaletteColor: (index: number) => void;
  togglePremiumFeature: (feature: PremiumFeatureCode) => void;
  setSelectedPackage: (selectedPackage: PackageCode) => void;
  setRemoveBranding: (removeBranding: boolean) => void;
  setTelegramProfile: (profile: TelegramProfile) => void;
  addGuest: (
    guest: Omit<
      GuestResponse,
      | "id"
      | "respondedAt"
      | "phone"
      | "magicToken"
      | "invitationUrl"
    >,
  ) => void;
  setGuests: (guests: GuestResponse[]) => void;
  prependGuest: (guest: GuestResponse) => void;
  updateGuest: (guest: GuestResponse) => void;
  setCoverPhoto: (coverPhoto: string | null) => void;
  setHeroImageDesktop: (image: string | null) => void;
  setHeroImageMobile: (image: string | null) => void;
  addGalleryPhotos: (photos: string[]) => void;
  removeGalleryPhoto: (index: number) => void;
  reorderGalleryPhotos: (activeIndex: number, overIndex: number) => void;
  addDressMoodboardPhotos: (photos: string[]) => void;
  removeDressMoodboardPhoto: (index: number) => void;
  addFaqItem: () => void;
  updateFaqItem: (
    id: string,
    field: keyof Pick<FaqItem, "question" | "answer">,
    value: string,
  ) => void;
  removeFaqItem: (id: string) => void;
  setGiftPaymentLink: (value: string) => void;
  setGiftQrCode: (value: string | null) => void;
  setCoordinatorField: (
    field:
      | "coordinatorName"
      | "coordinatorRole"
      | "coordinatorPhoto"
      | "coordinatorTelegram"
      | "coordinatorWhatsapp"
      | "coordinatorPhone"
      | "coordinatorMapLink",
    value: string | null,
  ) => void;
  setPhotoMask: (value: PhotoMaskCode) => void;
  setCardStyle: (value: CardStyleCode) => void;
  setPrivateSite: (value: boolean) => void;
  setPinCode: (value: string) => void;
  setLanguage: (value: LanguageCode) => void;
  addCrewTiming: () => void;
  updateCrewTiming: (
    id: string,
    field: keyof Pick<
      CrewTimingItem,
      "time" | "description" | "contactPerson"
    >,
    value: string,
  ) => void;
  removeCrewTiming: (id: string) => void;
  setInvitationText: (invitationText: string) => void;
  setWishlistText: (wishlistText: string) => void;
  setNoFlowersEnabled: (noFlowersEnabled: boolean) => void;
  setNoFlowersText: (noFlowersText: string) => void;
  setTransferDescription: (transferDescription: string) => void;
  setTransferTime: (transferTime: string) => void;
  setTransferMeetingPoint: (transferMeetingPoint: string) => void;
  addWishlistItem: () => void;
  updateWishlistItem: (
    id: string,
    field: keyof Pick<WishlistItem, "title" | "url" | "type">,
    value: string,
  ) => void;
  removeWishlistItem: (id: string) => void;
  setPostWeddingMode: (postWeddingMode: boolean) => void;
  setPostWeddingPhotoUrl: (postWeddingPhotoUrl: string) => void;
  setPostWeddingThankYouText: (value: string) => void;
  setCustomQuestions: (questions: WeddingBuilderData["customQuestions"]) => void;
};

const defaultVisibility: Record<BuilderModule, boolean> = {
  RSVP: true,
  DRESS_CODE: true,
  TIMELINE: true,
  TRANSFER: false,
  MAP: true,
  COUNTDOWN: true,
};

const initialState: WeddingBuilderData = {
  isPremium: false,
  removeBranding: false,
  partnerOneName: "Анна",
  partnerTwoName: "Антон",
  weddingDate: "2026-09-12",
  ceremonyTime: "17:00",
  venueName: "Усадьба «Лесная»",
  venueAddress: "Московская область",
  mapLatitude: null,
  mapLongitude: null,
  currentTheme: "MINIMAL",
  designTheme: null,
  fontCode: "PLAYFAIR",
  blockOrder: [
    "COUNTDOWN",
    "TIMELINE",
    "DRESS_CODE",
    "MAP",
    "TRANSFER",
    "WISHLIST",
    "COORDINATOR",
    "FAQ",
    "RSVP",
  ],
  moduleVisibility: defaultVisibility,
  musicTrack: null,
  musicTrackUrl: null,
  musicTrackTitle: null,
  customMusicDataUrl: null,
  customMusicName: null,
  countdownTitle: "До свадьбы осталось",
  countdownStyle: "MINIMAL",
  timelineEvents: [
    { id: "arrival", time: "17:00", title: "Сбор гостей" },
    { id: "ceremony", time: "17:30", title: "Церемония" },
    { id: "dinner", time: "18:00", title: "Ужин и танцы" },
  ],
  colorPalette: ["#E9E1D4", "#CDBBA7", "#9D8F7D", "#62675C", "#F7F3EA"],
  premiumFeatures: {
    PREMIUM_STYLE: false,
    RSVP_AUTOMATION: false,
    PERSONALIZATION: false,
    PREMIUM_MEDIA: false,
  },
  selectedPackage: "BASIC",
  telegramProfile: null,
  guests: [],
  heroImageDesktop: null,
  heroImageMobile: null,
  coverPhoto: null,
  galleryPhotos: [],
  dressMoodboard: [],
  faqItems: [],
  giftPaymentLink: "",
  giftQrCode: null,
  coordinatorName: "",
  coordinatorRole: "Координатор свадьбы",
  coordinatorPhoto: null,
  coordinatorTelegram: "",
  coordinatorWhatsapp: "",
  coordinatorPhone: "",
  coordinatorMapLink: "",
  photoMask: "RECTANGLE",
  cardStyle: "PLAIN",
  pinCode: "",
  isPrivate: false,
  language: "RU",
  crewTimings: [],
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
  postWeddingPhotoUrl: "",
  postWeddingThankYouText:
    "Спасибо, что разделили с нами этот день. Мы собрали здесь фотографии, к которым хочется возвращаться снова и снова.",
  customQuestions: [],
};

export const useWeddingStore = create<WeddingStore>()(
  persist(
    (set) => ({
      ...initialState,
      initializedSiteId: null,
      initialize: (data) => {
        const siteKey = data.siteId ?? "quiz-draft";

        set({
          ...data,
          initializedSiteId: siteKey,
        });
      },
      setNames: (partnerOneName, partnerTwoName) =>
        set({ partnerOneName, partnerTwoName }),
      setWeddingDate: (weddingDate) => set({ weddingDate }),
      setCeremonyTime: (ceremonyTime) => set({ ceremonyTime }),
      setVenueName: (venueName) => set({ venueName }),
      setVenueAddress: (venueAddress) => set({ venueAddress }),
      setMapCoordinates: (mapLatitude, mapLongitude) =>
        set({ mapLatitude, mapLongitude }),
      setCurrentTheme: (currentTheme) =>
        set({ currentTheme, designTheme: null }),
      setDesignTheme: (designTheme) => set({ designTheme }),
      setFontCode: (fontCode) => set({ fontCode }),
      reorderBlocks: (active, over) =>
        set((state) => {
          const from = state.blockOrder.indexOf(active);
          const to = state.blockOrder.indexOf(over);

          if (from < 0 || to < 0 || from === to) {
            return state;
          }

          const blockOrder = [...state.blockOrder];
          const [moved] = blockOrder.splice(from, 1);
          blockOrder.splice(to, 0, moved);
          return { blockOrder };
        }),
      toggleModule: (module) =>
        set((state) => ({
          moduleVisibility: {
            ...state.moduleVisibility,
            [module]: !state.moduleVisibility[module],
          },
        })),
      setMusicTrack: (track) =>
        set({
          musicTrack: track?.id ?? null,
          musicTrackUrl: track?.fileUrl ?? null,
          musicTrackTitle: track?.title ?? null,
          customMusicDataUrl: null,
          customMusicName: null,
        }),
      setCustomMusic: (customMusicDataUrl, customMusicName) =>
        set({
          customMusicDataUrl,
          customMusicName,
          musicTrack: null,
          musicTrackUrl: null,
          musicTrackTitle: null,
        }),
      setCountdownTitle: (countdownTitle) => set({ countdownTitle }),
      setCountdownStyle: (countdownStyle) => set({ countdownStyle }),
      addTimelineEvent: () =>
        set((state) => ({
          timelineEvents: [
            ...state.timelineEvents,
            {
              id: crypto.randomUUID(),
              time: "19:00",
              title: "Новое событие",
            },
          ],
        })),
      updateTimelineEvent: (id, field, value) =>
        set((state) => ({
          timelineEvents: state.timelineEvents.map((event) =>
            event.id === id ? { ...event, [field]: value } : event,
          ),
        })),
      removeTimelineEvent: (id) =>
        set((state) => ({
          timelineEvents: state.timelineEvents.filter((event) => event.id !== id),
        })),
      setPaletteColor: (index, color) =>
        set((state) => ({
          colorPalette: state.colorPalette.map((currentColor, currentIndex) =>
            currentIndex === index ? color : currentColor,
          ),
        })),
      setColorPalette: (colorPalette) =>
        set({ colorPalette: colorPalette.slice(0, 5) }),
      addPaletteColor: () =>
        set((state) => ({
          colorPalette:
            state.colorPalette.length >= 5
              ? state.colorPalette
              : [...state.colorPalette, "#D8C9B8"],
        })),
      removePaletteColor: (index) =>
        set((state) => ({
          colorPalette:
            state.colorPalette.length <= 3
              ? state.colorPalette
              : state.colorPalette.filter(
                  (_, currentIndex) => currentIndex !== index,
                ),
        })),
      togglePremiumFeature: (feature) =>
        set((state) => ({
          premiumFeatures: {
            ...state.premiumFeatures,
            [feature]: !state.premiumFeatures[feature],
          },
        })),
      setSelectedPackage: (selectedPackage) => set({ selectedPackage }),
      setRemoveBranding: (removeBranding) => set({ removeBranding }),
      setTelegramProfile: (telegramProfile) => set({ telegramProfile }),
      addGuest: (guest) =>
        set((state) => ({
          guests: [
            {
              ...guest,
              id: crypto.randomUUID(),
              phone: "",
              magicToken: null,
              invitationUrl: null,
              respondedAt: new Date().toISOString(),
            },
            ...state.guests,
          ],
        })),
      setGuests: (guests) => set({ guests }),
      prependGuest: (guest) =>
        set((state) => ({
          guests: [guest, ...state.guests.filter((item) => item.id !== guest.id)],
        })),
      updateGuest: (guest) =>
        set((state) => ({
          guests: state.guests.map((item) => (item.id === guest.id ? guest : item)),
        })),
      setCoverPhoto: (coverPhoto) => set({ coverPhoto }),
      setHeroImageDesktop: (heroImageDesktop) => set({ heroImageDesktop }),
      setHeroImageMobile: (heroImageMobile) => set({ heroImageMobile }),
      addGalleryPhotos: (photos) =>
        set((state) => ({
          galleryPhotos: [...state.galleryPhotos, ...photos].slice(0, 30),
        })),
      removeGalleryPhoto: (index) =>
        set((state) => ({
          galleryPhotos: state.galleryPhotos.filter(
            (_, currentIndex) => currentIndex !== index,
          ),
        })),
      reorderGalleryPhotos: (activeIndex, overIndex) =>
        set((state) => {
          if (
            activeIndex === overIndex ||
            activeIndex < 0 ||
            overIndex < 0 ||
            activeIndex >= state.galleryPhotos.length ||
            overIndex >= state.galleryPhotos.length
          ) {
            return state;
          }

          const galleryPhotos = [...state.galleryPhotos];
          const [movedPhoto] = galleryPhotos.splice(activeIndex, 1);
          galleryPhotos.splice(overIndex, 0, movedPhoto);
          return { galleryPhotos };
        }),
      addDressMoodboardPhotos: (photos) =>
        set((state) => ({
          dressMoodboard: [...state.dressMoodboard, ...photos].slice(0, 4),
        })),
      removeDressMoodboardPhoto: (index) =>
        set((state) => ({
          dressMoodboard: state.dressMoodboard.filter(
            (_, currentIndex) => currentIndex !== index,
          ),
        })),
      addFaqItem: () =>
        set((state) => ({
          faqItems:
            state.faqItems.length >= 12
              ? state.faqItems
              : [
                  ...state.faqItems,
                  {
                    id: crypto.randomUUID(),
                    question: "Можно ли приехать с детьми?",
                    answer: "Да, конечно. Будем рады видеть всю вашу семью.",
                  },
                ],
        })),
      updateFaqItem: (id, field, value) =>
        set((state) => ({
          faqItems: state.faqItems.map((item) =>
            item.id === id ? { ...item, [field]: value } : item,
          ),
        })),
      removeFaqItem: (id) =>
        set((state) => ({
          faqItems: state.faqItems.filter((item) => item.id !== id),
        })),
      setGiftPaymentLink: (giftPaymentLink) => set({ giftPaymentLink }),
      setGiftQrCode: (giftQrCode) => set({ giftQrCode }),
      setCoordinatorField: (field, value) =>
        set({ [field]: value } as Partial<WeddingBuilderData>),
      setPhotoMask: (photoMask) => set({ photoMask }),
      setCardStyle: (cardStyle) => set({ cardStyle }),
      setPrivateSite: (isPrivate) =>
        set((state) => ({
          isPrivate,
          pinCode: isPrivate ? state.pinCode : "",
        })),
      setPinCode: (pinCode) => set({ pinCode }),
      setLanguage: (language) => set({ language }),
      addCrewTiming: () =>
        set((state) => ({
          crewTimings: [
            ...state.crewTimings,
            {
              id: crypto.randomUUID(),
              time: "12:00",
              description: "Новая задача",
              contactPerson: "Координатор",
            },
          ],
        })),
      updateCrewTiming: (id, field, value) =>
        set((state) => ({
          crewTimings: state.crewTimings.map((item) =>
            item.id === id ? { ...item, [field]: value } : item,
          ),
        })),
      removeCrewTiming: (id) =>
        set((state) => ({
          crewTimings: state.crewTimings.filter((item) => item.id !== id),
        })),
      setInvitationText: (invitationText) => set({ invitationText }),
      setWishlistText: (wishlistText) => set({ wishlistText }),
      setNoFlowersEnabled: (noFlowersEnabled) => set({ noFlowersEnabled }),
      setNoFlowersText: (noFlowersText) => set({ noFlowersText }),
      setTransferDescription: (transferDescription) =>
        set({ transferDescription }),
      setTransferTime: (transferTime) => set({ transferTime }),
      setTransferMeetingPoint: (transferMeetingPoint) =>
        set({ transferMeetingPoint }),
      addWishlistItem: () =>
        set((state) => ({
          wishlistItems:
            state.wishlistItems.length >= 8
              ? state.wishlistItems
              : [
                  ...state.wishlistItems,
                  {
                    id: crypto.randomUUID(),
                    title: "Подарок",
                    url: "",
                    type: "ITEM",
                  },
                ],
        })),
      updateWishlistItem: (id, field, value) =>
        set((state) => ({
          wishlistItems: state.wishlistItems.map((item) =>
            item.id === id ? { ...item, [field]: value } : item,
          ),
        })),
      removeWishlistItem: (id) =>
        set((state) => ({
          wishlistItems: state.wishlistItems.filter((item) => item.id !== id),
        })),
      setPostWeddingMode: (postWeddingMode) => set({ postWeddingMode }),
      setPostWeddingPhotoUrl: (postWeddingPhotoUrl) =>
        set({ postWeddingPhotoUrl }),
      setPostWeddingThankYouText: (postWeddingThankYouText) =>
        set({ postWeddingThankYouText }),
      setCustomQuestions: (customQuestions) => set({ customQuestions }),
    }),
    {
      name: "wedding-builder-constructor",
      partialize: (state) => ({
        siteId: state.siteId,
        slug: state.slug,
        isPremium: state.isPremium,
        removeBranding: state.removeBranding,
        partnerOneName: state.partnerOneName,
        partnerTwoName: state.partnerTwoName,
        weddingDate: state.weddingDate,
        ceremonyTime: state.ceremonyTime,
        venueName: state.venueName,
        venueAddress: state.venueAddress,
        mapLatitude: state.mapLatitude,
        mapLongitude: state.mapLongitude,
        currentTheme: state.currentTheme,
        designTheme: state.designTheme,
        fontCode: state.fontCode,
        blockOrder: state.blockOrder,
        moduleVisibility: state.moduleVisibility,
          musicTrack: state.musicTrack,
          musicTrackUrl: state.musicTrackUrl,
          musicTrackTitle: state.musicTrackTitle,
        customMusicName: state.customMusicName,
        countdownTitle: state.countdownTitle,
        countdownStyle: state.countdownStyle,
        timelineEvents: state.timelineEvents,
        colorPalette: state.colorPalette,
        premiumFeatures: state.premiumFeatures,
        selectedPackage: state.selectedPackage,
        telegramProfile: state.telegramProfile,
        guests: state.guests,
        heroImageDesktop: state.heroImageDesktop,
        heroImageMobile: state.heroImageMobile,
        dressMoodboard: state.dressMoodboard,
        faqItems: state.faqItems,
        giftPaymentLink: state.giftPaymentLink,
        giftQrCode: state.giftQrCode,
        coordinatorName: state.coordinatorName,
        coordinatorRole: state.coordinatorRole,
        coordinatorPhoto: state.coordinatorPhoto,
        coordinatorTelegram: state.coordinatorTelegram,
        coordinatorWhatsapp: state.coordinatorWhatsapp,
        coordinatorPhone: state.coordinatorPhone,
        coordinatorMapLink: state.coordinatorMapLink,
        photoMask: state.photoMask,
        cardStyle: state.cardStyle,
        pinCode: state.pinCode,
        isPrivate: state.isPrivate,
        language: state.language,
        crewTimings: state.crewTimings,
        wishlistText: state.wishlistText,
        wishlistItems: state.wishlistItems,
        noFlowersEnabled: state.noFlowersEnabled,
        noFlowersText: state.noFlowersText,
        transferDescription: state.transferDescription,
        transferTime: state.transferTime,
        transferMeetingPoint: state.transferMeetingPoint,
        invitationText: state.invitationText,
        postWeddingMode: state.postWeddingMode,
        postWeddingPhotoUrl: state.postWeddingPhotoUrl,
        postWeddingThankYouText: state.postWeddingThankYouText,
        customQuestions: state.customQuestions,
        initializedSiteId: state.initializedSiteId,
      }),
    },
  ),
);
