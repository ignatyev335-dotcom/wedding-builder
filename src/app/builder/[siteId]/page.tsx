import { notFound } from "next/navigation";

import type {
  BuilderModule,
  WeddingBuilderData,
} from "@/entities/wedding/model";
import { ConstructorClient } from "@/features/constructor/ui/constructor-client";
import { parseSiteExtras } from "@/features/constructor/lib/site-extras";
import { prisma } from "@/lib/prisma";

type BuilderPageProps = {
  params: Promise<{ siteId: string }>;
};

const builderModules: BuilderModule[] = [
  "RSVP",
  "DRESS_CODE",
  "TIMELINE",
  "TRANSFER",
  "MAP",
  "COUNTDOWN",
];

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { siteId } = await params;
  const site = await prisma.weddingSite.findUnique({
    where: { id: siteId },
    include: { data: true, modules: true, user: true, guests: true },
  });

  if (!site?.data) {
    notFound();
  }

  const enabledModules = new Set(
    site.modules.filter((module) => module.isEnabled).map((module) => module.type),
  );
  const extras = parseSiteExtras(site.data.customContent);
  const fallbackTimeline = [
    { id: "arrival", time: "16:00", title: "Сбор гостей" },
    { id: "ceremony", time: "16:30", title: "Церемония" },
    { id: "dinner", time: "18:00", title: "Ужин и танцы" },
  ];
  const fallbackPalette = ["#E9E1D4", "#CDBBA7", "#9D8F7D", "#62675C", "#F7F3EA"];
  const initialData: WeddingBuilderData = {
    siteId: site.id,
    slug: site.slug,
    partnerOneName: site.data.partnerOneName,
    partnerTwoName: site.data.partnerTwoName,
    weddingDate: site.data.weddingDate.toISOString().slice(0, 10),
    ceremonyTime: site.data.ceremonyTime ?? "16:00",
    venueName: site.data.venueName ?? "Место проведения",
    venueAddress: site.data.venueAddress ?? "",
    mapLatitude: site.data.mapLatitude,
    mapLongitude: site.data.mapLongitude,
    currentTheme: site.theme,
    moduleVisibility: Object.fromEntries(
      builderModules.map((module) => [module, enabledModules.has(module)]),
    ) as Record<BuilderModule, boolean>,
    musicTrack: site.musicTrackId,
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
      allergies: guest.allergies ?? "",
      drinks: (JSON.parse(guest.alcoholPreferences) as string[]).join(", "),
      needsTransport: guest.needsTransport,
      respondedAt: (guest.respondedAt ?? guest.createdAt).toISOString(),
    })),
    ...extras,
  };

  return <ConstructorClient initialData={initialData} />;
}
