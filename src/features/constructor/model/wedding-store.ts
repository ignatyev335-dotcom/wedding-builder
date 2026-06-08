"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  BuilderModule,
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
  setCurrentTheme: (theme: ThemeCode) => void;
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
  addGuest: (guest: Omit<GuestResponse, "id" | "respondedAt">) => void;
  setCoverPhoto: (coverPhoto: string | null) => void;
  addGalleryPhotos: (photos: string[]) => void;
  removeGalleryPhoto: (index: number) => void;
  setInvitationText: (invitationText: string) => void;
  setWishlistText: (wishlistText: string) => void;
  addWishlistItem: () => void;
  updateWishlistItem: (
    id: string,
    field: keyof Pick<WishlistItem, "title" | "url">,
    value: string,
  ) => void;
  removeWishlistItem: (id: string) => void;
  setPostWeddingMode: (postWeddingMode: boolean) => void;
};

const defaultVisibility: Record<BuilderModule, boolean> = {
  RSVP: true,
  DRESS_CODE: true,
  TIMELINE: true,
  TRANSFER: false,
  MAP: true,
};

const initialState: WeddingBuilderData = {
  partnerOneName: "Анна",
  partnerTwoName: "Антон",
  weddingDate: "2026-09-12",
  currentTheme: "MINIMAL",
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
  postWeddingMode: false,
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
      setCurrentTheme: (currentTheme) => set({ currentTheme }),
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
              respondedAt: new Date().toISOString(),
            },
            ...state.guests,
          ],
        })),
      setCoverPhoto: (coverPhoto) => set({ coverPhoto }),
      addGalleryPhotos: (photos) =>
        set((state) => ({
          galleryPhotos: [...state.galleryPhotos, ...photos].slice(0, 8),
        })),
      removeGalleryPhoto: (index) =>
        set((state) => ({
          galleryPhotos: state.galleryPhotos.filter(
            (_, currentIndex) => currentIndex !== index,
          ),
        })),
      setInvitationText: (invitationText) => set({ invitationText }),
      setWishlistText: (wishlistText) => set({ wishlistText }),
      addWishlistItem: () =>
        set((state) => ({
          wishlistItems:
            state.wishlistItems.length >= 3
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
    }),
    {
      name: "wedding-builder-constructor",
      partialize: (state) => ({
        siteId: state.siteId,
        slug: state.slug,
        partnerOneName: state.partnerOneName,
        partnerTwoName: state.partnerTwoName,
        weddingDate: state.weddingDate,
        currentTheme: state.currentTheme,
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
        invitationText: state.invitationText,
        postWeddingMode: state.postWeddingMode,
        initializedSiteId: state.initializedSiteId,
      }),
    },
  ),
);
