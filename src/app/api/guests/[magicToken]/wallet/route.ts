import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ magicToken: string }> },
) {
  const signerUrl = process.env.APPLE_WALLET_SIGNER_URL;
  if (!signerUrl) {
    return NextResponse.json(
      {
        error:
          "Apple Wallet станет доступен после подключения Pass Type ID и сертификата подписи.",
      },
      { status: 503 },
    );
  }

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

  const site = guest.weddingSite;
  const origin = new URL(request.url).origin;
  const invitationUrl = `${origin}/wedding/${site.slug}?guest=${encodeURIComponent(magicToken)}`;
  const signerResponse = await fetch(signerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.APPLE_WALLET_SIGNER_TOKEN
        ? { Authorization: `Bearer ${process.env.APPLE_WALLET_SIGNER_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      serialNumber: guest.id,
      description: "Приглашение на свадьбу",
      guestName: guest.name,
      coupleNames: `${data.partnerOneName} и ${data.partnerTwoName}`,
      weddingDate: data.weddingDate.toISOString(),
      ceremonyTime: data.ceremonyTime || "17:00",
      venue: [data.venueName, data.venueAddress].filter(Boolean).join(", "),
      dressCode: data.dressCodeText || data.colorPalette || "",
      qrCode: invitationUrl,
    }),
    cache: "no-store",
  });

  if (!signerResponse.ok) {
    return NextResponse.json(
      { error: "Не удалось подписать билет Apple Wallet." },
      { status: 502 },
    );
  }

  return new NextResponse(await signerResponse.arrayBuffer(), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": 'attachment; filename="wedding-invitation.pkpass"',
      "Cache-Control": "private, no-store",
    },
  });
}
