import { notFound } from "next/navigation";

import type { BuilderModule, WeddingBuilderData } from "@/entities/wedding/model";
import { parseSiteExtras } from "@/features/constructor/lib/site-extras";
import { PublicInvitation } from "@/features/constructor/ui/public-invitation";
import { prisma } from "@/lib/prisma";

const builderModules: BuilderModule[] = [
  "RSVP",
  "DRESS_CODE",
  "TIMELINE",
  "TRANSFER",
  "MAP",
];

export default async function WeddingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await prisma.weddingSite.findUnique({
    where: { slug },
    include: { data: true, modules: true, user: true, guests: true },
  });

  if (!site?.data) {
    notFound();
  }

  const enabledModules = new Set(
    site.modules.filter((module) => module.isEnabled).map((module) => module.type),
  );
  const extras = parseSiteExtras(site.data.customContent);
  const initialData: WeddingBuilderData = {
    siteId: site.id,
    slug: site.slug,
    partnerOneName: site.data.partnerOneName,
    partnerTwoName: site.data.partnerTwoName,
    weddingDate: site.data.weddingDate.toISOString().slice(0, 10),
    currentTheme: site.theme === "BOHO" ? "BOHO" : "MINIMAL",
    moduleVisibility: Object.fromEntries(
      builderModules.map((module) => [module, enabledModules.has(module)]),
    ) as Record<BuilderModule, boolean>,
    musicTrack: site.musicTrackId,
    timelineEvents: site.data.timeline
      ? JSON.parse(site.data.timeline)
      : [
          { id: "arrival", time: "16:00", title: "Сбор гостей" },
          { id: "ceremony", time: "16:30", title: "Церемония" },
          { id: "dinner", time: "18:00", title: "Ужин и танцы" },
        ],
    colorPalette: site.data.colorPalette
      ? JSON.parse(site.data.colorPalette)
      : ["#E9E1D4", "#CDBBA7", "#9D8F7D", "#62675C", "#F7F3EA"],
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
      name: guest.guestName,
      status:
        guest.attendance === "ATTENDING"
          ? "ATTENDING"
          : guest.attendance === "NOT_ATTENDING"
            ? "NOT_ATTENDING"
            : "PENDING",
      dietaryRestrictions: guest.dietaryRestrictions ?? "",
      drinks: (JSON.parse(guest.alcoholPreferences) as string[]).join(", "),
      needsTransport: guest.needsTransport,
      respondedAt: (guest.respondedAt ?? guest.createdAt).toISOString(),
    })),
    ...extras,
  };

  return <PublicInvitation initialData={initialData} />;
}
