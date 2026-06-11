import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const cmsSchema = z.object({
  greetingEnabled: z.boolean(),
  timelineEnabled: z.boolean(),
  dressCodeEnabled: z.boolean(),
  mapEnabled: z.boolean(),
  rsvpEnabled: z.boolean(),
  primaryButtonText: z.string().trim().min(1).max(120),
  footerText: z.string().trim().min(1).max(240),
  errorText: z.string().trim().min(1).max(500),
});

export async function PUT(request: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  const parsed = cmsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте настройки секций и тексты." },
      { status: 400 },
    );
  }

  const content = await prisma.platformContent.upsert({
    where: { id: "global" },
    update: parsed.data,
    create: { id: "global", ...parsed.data },
  });
  return NextResponse.json({ content });
}
