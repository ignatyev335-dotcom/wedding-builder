import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const [tracks, templates, designThemes, mediaAssets] = await Promise.all([
    prisma.audioTrack.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        artist: true,
        fileUrl: true,
      },
    }),
    prisma.invitationTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        content: true,
      },
    }),
    prisma.designTheme.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        backgroundColor: true,
        primaryColor: true,
        textColor: true,
        fontFamily: true,
      },
    }),
    prisma.mediaAsset.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, url: true },
    }),
  ]);

  return NextResponse.json({ tracks, templates, designThemes, mediaAssets });
}
