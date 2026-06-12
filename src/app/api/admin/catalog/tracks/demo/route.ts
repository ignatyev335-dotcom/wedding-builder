import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const demoTracks = [
  {
    title: "Morning Vows",
    artist: "Vowly Session",
    fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    title: "Golden Hour Waltz",
    artist: "Vowly Session",
    fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    title: "Soft Celebration",
    artist: "Vowly Session",
    fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
];

export async function POST() {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  try {
    const existingCount = await prisma.audioTrack.count();
    const createdTracks = await Promise.all(
      demoTracks.map((track, index) =>
        prisma.audioTrack.create({
          data: {
            ...track,
            isActive: true,
            sortOrder: existingCount + index,
          },
          select: {
            id: true,
            title: true,
            artist: true,
            fileUrl: true,
            isActive: true,
            sortOrder: true,
          },
        }),
      ),
    );

    return NextResponse.json({ tracks: createdTracks }, { status: 201 });
  } catch (error) {
    console.error("Track demo seed failed", error);
    return NextResponse.json(
      { error: "Не удалось загрузить демо-треки." },
      { status: 500 },
    );
  }
}
