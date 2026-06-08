"use client";

import type { BuilderModule, WeddingBuilderData } from "@/entities/wedding/model";
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
  ];

  const initialData: WeddingBuilderData = {
    siteId: "quiz-draft",
    slug: "preview",
    partnerOneName: quiz.partnerOneName || "Анна",
    partnerTwoName: quiz.partnerTwoName || "Антон",
    weddingDate: quiz.weddingDate || "2026-09-12",
    currentTheme: quiz.theme === "BOHO" ? "BOHO" : "MINIMAL",
    moduleVisibility: Object.fromEntries(
      modules.map((module) => [module, selected.has(module)]),
    ) as Record<BuilderModule, boolean>,
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

  return <ConstructorClient initialData={initialData} />;
}
