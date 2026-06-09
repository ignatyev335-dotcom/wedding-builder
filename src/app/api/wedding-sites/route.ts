import { ModuleType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { quizSchema } from "@/features/onboarding/model/quiz-schema";
import {
  getRequestSession,
  setSessionCookie,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const baseModules: ModuleType[] = [ModuleType.HERO];

function slugPart(value: string) {
  const transliteration: Record<string, string> = {
    "\u0430": "a", "\u0431": "b", "\u0432": "v", "\u0433": "g",
    "\u0434": "d", "\u0435": "e", "\u0451": "e", "\u0436": "zh",
    "\u0437": "z", "\u0438": "i", "\u0439": "y", "\u043a": "k",
    "\u043b": "l", "\u043c": "m", "\u043d": "n", "\u043e": "o",
    "\u043f": "p", "\u0440": "r", "\u0441": "s", "\u0442": "t",
    "\u0443": "u", "\u0444": "f", "\u0445": "h", "\u0446": "c",
    "\u0447": "ch", "\u0448": "sh", "\u0449": "sch", "\u044a": "",
    "\u044b": "y", "\u044c": "", "\u044d": "e", "\u044e": "yu",
    "\u044f": "ya",
  };

  return value
    .toLowerCase()
    .split("")
    .map((character) => transliteration[character] ?? character)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    const parsed = quizSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Некорректные данные." },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const nameSlug = `${slugPart(data.partnerOneName)}-${slugPart(data.partnerTwoName)}`
      .replace(/^-+|-+$/g, "");
    const baseSlug = nameSlug || "wedding";
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
    const selectedModules = [...baseModules, ...data.modules] as ModuleType[];
    const session = getRequestSession(request);
    const sessionUser = session
      ? await prisma.user.findUnique({
          where: { id: session.userId },
          select: { id: true },
        })
      : null;
    let createdAnonymousUserId: string | null = null;

    const site = await prisma.$transaction(async (transaction) => {
      const userId =
        sessionUser?.id ??
        (
          await transaction.user.create({
            data: {
              name: `${data.partnerOneName} и ${data.partnerTwoName}`,
              provider: "ANONYMOUS",
            },
          })
        ).id;
      if (!sessionUser) createdAnonymousUserId = userId;

      return transaction.weddingSite.create({
        data: {
          userId,
          slug,
          theme: data.theme,
          data: {
            create: {
              partnerOneName: data.partnerOneName.trim(),
              partnerTwoName: data.partnerTwoName.trim(),
              weddingDate: new Date(`${data.weddingDate}T12:00:00.000Z`),
              ceremonyTime: data.ceremonyTime,
              welcomeText: "Будем счастливы разделить этот день с вами.",
              timeline: JSON.stringify([
                { id: "arrival", time: "16:00", title: "Сбор гостей" },
                { id: "ceremony", time: "16:30", title: "Церемония" },
                { id: "dinner", time: "18:00", title: "Ужин и танцы" },
              ]),
              colorPalette: JSON.stringify([
                "#E9E1D4",
                "#CDBBA7",
                "#9D8F7D",
                "#62675C",
                "#F7F3EA",
              ]),
            },
          },
          modules: {
            create: selectedModules.map((type, index) => ({
              type,
              sortOrder: index,
              isEnabled: true,
            })),
          },
        },
        select: { id: true, slug: true },
      });
    });

    const response = NextResponse.json(site, { status: 201 });
    if (createdAnonymousUserId) {
      setSessionCookie(response, createdAnonymousUserId);
    }
    return response;
  } catch (error) {
    console.error("Failed to create wedding site", error);

    const message = (() => {
      if (error instanceof Prisma.PrismaClientInitializationError) {
        return "База PostgreSQL временно недоступна. Проверьте переменные подключения.";
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return "Не удалось сохранить проект в базе данных.";
      }

      return "Сервис временно недоступен.";
    })();

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
