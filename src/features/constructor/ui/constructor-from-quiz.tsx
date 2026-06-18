"use client";

import type { BuilderModule, WeddingBuilderData } from "@/entities/wedding/model";
import { defaultPlatformContent } from "@/features/constructor/lib/platform-content";
import { useQuizStore } from "@/features/onboarding/model/quiz-store";
import { ConstructorClient } from "@/features/constructor/ui/constructor-client";

export function ConstructorFromQuiz() {
  const quiz = useQuizStore();
  const selected = new Set(quiz.modules);
  const modules: BuilderModule[] = [
    "RSVP",
    "DRESS_CODE",
    "TIMELINE",
    "TRANSFER",
    "MAP",
    "COUNTDOWN",
  ];

  const initialData: WeddingBuilderData = {
    isPremium: false,
    removeBranding: false,
    siteId: "quiz-draft",
    slug: "preview",
    partnerOneName: quiz.partnerOneName || "Анна",
    partnerTwoName: quiz.partnerTwoName || "Антон",
    weddingDate: quiz.weddingDate || "2026-09-12",
    ceremonyTime: quiz.ceremonyTime || "17:00",
    venueName: "Усадьба «Лесная»",
    venueAddress: "Московская область",
    mapLatitude: null,
    mapLongitude: null,
    currentTheme: quiz.theme,
    designTheme: null,
    decorativeAsset: null,
    platformContent: defaultPlatformContent,
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
    moduleVisibility: Object.fromEntries(
      modules.map((module) => [module, selected.has(module)]),
    ) as Record<BuilderModule, boolean>,
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
    postWeddingAutoEnabled: false,
    postWeddingHeroImage: null,
    postWeddingPhotoUrl: "",
    postWeddingThankYouText:
      "Спасибо, что разделили с нами этот день. Мы собрали здесь фотографии, к которым хочется возвращаться снова и снова.",
    customQuestions: [],
  };

  return <ConstructorClient initialData={initialData} />;
}
