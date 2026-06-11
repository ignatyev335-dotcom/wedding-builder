import type {
  BuilderModule,
  LanguageCode,
  PhotoMaskCode,
  WeddingBuilderData,
} from "@/entities/wedding/model";
import {
  parseFaqItems,
  parseCustomQuestions,
  parseImageList,
  parseSiteExtras,
} from "@/features/constructor/lib/site-extras";
import { prisma } from "@/lib/prisma";
import { defaultPlatformContent } from "@/features/constructor/lib/platform-content";

const builderModules: BuilderModule[] = [
  "RSVP",
  "DRESS_CODE",
  "TIMELINE",
  "TRANSFER",
  "MAP",
  "COUNTDOWN",
];

const fallbackTimeline = [
  { id: "arrival", time: "17:00", title: "Сбор гостей" },
  { id: "ceremony", time: "17:30", title: "Церемония" },
  { id: "dinner", time: "18:00", title: "Ужин и танцы" },
];

const fallbackPalette = [
  "#E9E1D4",
  "#CDBBA7",
  "#9D8F7D",
  "#62675C",
  "#F7F3EA",
];

export async function getWeddingBuilderData(
  siteId: string,
): Promise<WeddingBuilderData | null> {
  const site = await prisma.weddingSite.findUnique({
    where: { id: siteId },
    include: {
      data: true,
      modules: true,
      user: true,
      guests: true,
      musicTrack: true,
      designTheme: true,
      decorativeAsset: true,
      crewTimings: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!site?.data) {
    return null;
  }
  const platformContent =
    (await prisma.platformContent.findUnique({ where: { id: "global" } })) ??
    defaultPlatformContent;

  const enabledModules = new Set(
    site.modules.filter((module) => module.isEnabled).map((module) => module.type),
  );

  const extras = parseSiteExtras(site.data.customContent);

  return {
    siteId: site.id,
    slug: site.slug,
    isPremium: site.isPremium,
    removeBranding: site.removeBranding,
    partnerOneName: site.data.partnerOneName,
    partnerTwoName: site.data.partnerTwoName,
    weddingDate: site.data.weddingDate.toISOString().slice(0, 10),
    ceremonyTime: site.data.ceremonyTime ?? "17:00",
    venueName: site.data.venueName ?? "Место проведения",
    venueAddress: site.data.venueAddress ?? "",
    mapLatitude: site.data.mapLatitude,
    mapLongitude: site.data.mapLongitude,
    currentTheme: site.theme,
    designTheme: site.designTheme,
    decorativeAsset: site.decorativeAsset,
    platformContent,
    moduleVisibility: Object.fromEntries(
      builderModules.map((module) => [module, enabledModules.has(module)]),
    ) as Record<BuilderModule, boolean>,
    musicTrack: site.musicTrackId,
    musicTrackUrl: site.musicTrack?.fileUrl ?? null,
    musicTrackTitle: site.musicTrack?.title ?? null,
    timelineEvents: site.data.timeline
      ? JSON.parse(site.data.timeline)
      : fallbackTimeline,
    colorPalette: site.data.colorPalette
      ? JSON.parse(site.data.colorPalette)
      : fallbackPalette,
    premiumFeatures: {
      PREMIUM_STYLE: site.removeBranding,
      RSVP_AUTOMATION: site.rsvpEnabled && site.telegramAlerts,
      PERSONALIZATION: site.personalLinks,
      PREMIUM_MEDIA: site.premiumMusic && site.galleryEnabled,
    },
    selectedPackage:
      site.personalLinks || site.premiumMusic || site.telegramAlerts
        ? "PREMIUM"
        : site.rsvpEnabled || site.removeBranding
          ? "INTERACTIVE"
          : "BASIC",
    telegramProfile:
      site.user.telegramId && site.user.telegramChatId
        ? {
            telegramId: site.user.telegramId,
            chatId: site.user.telegramChatId,
            name: site.user.name ?? "Telegram-профиль",
          }
        : null,
    guests: site.guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      phone: guest.phone,
      status: guest.status,
      magicToken: guest.magicToken,
      invitationUrl: guest.magicToken
        ? `/wedding/${site.slug}?guest=${guest.magicToken}`
        : null,
      dietaryRestrictions: guest.dietaryRestrictions ?? "",
      foodPreference: guest.foodPreference ?? "",
      partnerFoodPreference: guest.partnerFoodPreference ?? "",
      allergies: guest.allergies ?? "",
      partnerAllergies: guest.partnerAllergies ?? "",
      drinks: (JSON.parse(guest.alcoholPreferences) as string[]).join(", "),
      alcoholPreferences: JSON.parse(
        guest.alcoholPreferences,
      ) as WeddingBuilderData["guests"][number]["alcoholPreferences"],
      needsTransport: guest.needsTransport,
      transportPreference: guest.transportPreference,
      hasPlusOne: guest.hasPlusOne,
      plusOneName: guest.plusOneName ?? "",
      musicRequest: guest.musicRequest ?? "",
      isCouple: guest.isCouple,
      partnerName: guest.partnerName ?? "",
      attendanceChoice: guest.attendanceChoice as WeddingBuilderData["guests"][number]["attendanceChoice"],
      tags: JSON.parse(guest.tags) as WeddingBuilderData["guests"][number]["tags"],
      customAnswers: JSON.parse(
        guest.customAnswers,
      ) as WeddingBuilderData["guests"][number]["customAnswers"],
      respondedAt: (guest.respondedAt ?? guest.createdAt).toISOString(),
    })),
    ...extras,
    heroImageDesktop: site.heroImageDesktop ?? extras.coverPhoto,
    heroImageMobile: site.heroImageMobile ?? extras.coverPhoto,
    dressMoodboard: parseImageList(site.data.dressMoodboard, 4),
    faqItems: parseFaqItems(site.data.faqItems),
    customQuestions: parseCustomQuestions(site.data.customQuestions),
    giftPaymentLink: site.giftPaymentLink ?? "",
    giftQrCode: site.giftQrCode,
    coordinatorName: site.data.coordinatorName ?? "",
    coordinatorRole: site.data.coordinatorRole ?? "Координатор свадьбы",
    coordinatorPhoto: site.data.coordinatorPhoto,
    coordinatorTelegram: site.data.coordinatorTelegram ?? "",
    coordinatorWhatsapp: site.data.coordinatorWhatsapp ?? "",
    coordinatorPhone: site.data.coordinatorPhone ?? "",
    coordinatorMapLink: site.data.coordinatorMapLink ?? "",
    photoMask: (site.data.photoMask as PhotoMaskCode | null) ?? "RECTANGLE",
    pinCode: site.pinCode ?? "",
    isPrivate: Boolean(site.pinCode),
    language: (site.defaultLanguage as LanguageCode) ?? "RU",
    crewTimings: site.crewTimings.map((item) => ({
      id: item.id,
      time: item.time,
      description: item.description,
      contactPerson: item.contactPerson,
    })),
  };
}
