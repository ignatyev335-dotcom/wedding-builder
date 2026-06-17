import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const [tracks, templates, designThemes] = await Promise.all([
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
        gradientCss: true,
        fontFamily: true,
        customFont: {
          select: {
            id: true,
            name: true,
            family: true,
            fileUrl: true,
            format: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ tracks, templates, designThemes });
}
