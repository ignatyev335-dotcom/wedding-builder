import { NextResponse } from "next/server";

import {
  buildGoogleCalendarUrl,
  buildWeddingIcs,
} from "@/features/calendar/server/wedding-calendar";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ magicToken: string }> },
) {
  const { magicToken } = await params;
  const guest = await prisma.guest.findUnique({
    where: { magicToken },
    include: {
      weddingSite: {
        include: { data: true },
      },
    },
  });

  const data = guest?.weddingSite.data;
  if (!guest || !data) {
    return NextResponse.json({ error: "Приглашение не найдено." }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const site = guest.weddingSite;
  const invitationUrl = `${origin}/wedding/${site.slug}?guest=${encodeURIComponent(magicToken)}`;
  const event = {
    title: `Свадьба ${data.partnerOneName} и ${data.partnerTwoName}`,
    date: data.weddingDate,
    time: data.ceremonyTime || "17:00",
    address: [data.venueName, data.venueAddress].filter(Boolean).join(", "),
    url: invitationUrl,
  };

  if (new URL(request.url).searchParams.get("provider") === "google") {
    return NextResponse.redirect(buildGoogleCalendarUrl(event));
  }

  return new NextResponse(buildWeddingIcs(event), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wedding.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
