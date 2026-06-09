"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  BuilderModule,
  ContentBlockCode,
  FontCode,
  GuestResponse,
  PackageCode,
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
  setFontCode: (fontCode: FontCode) => void;
  reorderBlocks: (active: ContentBlockCode, over: ContentBlockCode) => void;
  toggleModule: (module: BuilderModule) => void;
  setMusicTrack: (track: string | null) => void;
  addTimelineEvent: () => void;
  updateTimelineEvent: (
    id: string,
    field: "time" | "title",
    value: string,
  ) => void;
  removeTimelineEvent: (id: string) => void;
  setPaletteColor: (index: number, color: string) => void;
  togglePremiumFeature: (feature: PremiumFeatureCode) => void;
  setSelectedPackage: (selectedPackage: PackageCode) => void;
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
  addGalleryPhotos: (photos: string[]) => void;
  removeGalleryPhoto: (index: number) => void;
  reorderGalleryPhotos: (activeIndex: number, overIndex: number) => void;
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
    field: keyof Pick<WishlistItem, "title" | "url">,
    value: string,
  ) => void;
  removeWishlistItem: (id: string) => void;
  setPostWeddingMode: (postWeddingMode: boolean) => void;
  setPostWeddingPhotoUrl: (postWeddingPhotoUrl: string) => void;
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
  partnerOneName: "Анна",
  partnerTwoName: "Антон",
  weddingDate: "2026-09-12",
  ceremonyTime: "16:00",
  venueName: "Усадьба «Лесная»",
  venueAddress: "Московская область",
  mapLatitude: null,
  mapLongitude: null,
  currentTheme: "MINIMAL",
  fontCode: "PLAYFAIR",
  blockOrder: [
    "COUNTDOWN",
    "TIMELINE",
    "DRESS_CODE",
    "MAP",
    "TRANSFER",
    "WISHLIST",
    "RSVP",
  ],
  moduleVisibility: defaultVisibility,
  musicTrack: null,
  timelineEvents: [
    { id: "arrival", time: "16:00", title: "Сбор гостей" },
    { id: "ceremony", time: "16:30", title: "Церемония" },
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
      setCurrentTheme: (currentTheme) => set({ currentTheme }),
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
      setMusicTrack: (musicTrack) => set({ musicTrack }),
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
      togglePremiumFeature: (feature) =>
        set((state) => ({
          premiumFeatures: {
            ...state.premiumFeatures,
            [feature]: !state.premiumFeatures[feature],
          },
        })),
      setSelectedPackage: (selectedPackage) => set({ selectedPackage }),
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
                  { id: crypto.randomUUID(), title: "Подарок", url: "" },
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
    }),
    {
      name: "wedding-builder-constructor",
      partialize: (state) => ({
        siteId: state.siteId,
        slug: state.slug,
        partnerOneName: state.partnerOneName,
        partnerTwoName: state.partnerTwoName,
        weddingDate: state.weddingDate,
        ceremonyTime: state.ceremonyTime,
        venueName: state.venueName,
        venueAddress: state.venueAddress,
        mapLatitude: state.mapLatitude,
        mapLongitude: state.mapLongitude,
        currentTheme: state.currentTheme,
        fontCode: state.fontCode,
        blockOrder: state.blockOrder,
        moduleVisibility: state.moduleVisibility,
        musicTrack: state.musicTrack,
        timelineEvents: state.timelineEvents,
        colorPalette: state.colorPalette,
        premiumFeatures: state.premiumFeatures,
        selectedPackage: state.selectedPackage,
        telegramProfile: state.telegramProfile,
        guests: state.guests,
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
        initializedSiteId: state.initializedSiteId,
      }),
    },
  ),
);
