import { ModuleType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { quizSchema } from "@/features/onboarding/model/quiz-schema";
import { sendWeddingWelcomeEmail } from "@/features/notifications/server/send-wedding-welcome-email";
import {
  getRequestSession,
  setSessionCookie,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const baseModules: ModuleType[] = [
  ModuleType.HERO,
  ModuleType.RSVP,
  ModuleType.DRESS_CODE,
  ModuleType.TIMELINE,
  ModuleType.MAP,
  ModuleType.COUNTDOWN,
];

function slugPart(value: string) {
  const transliteration: Record<string, string> = {
    "а": "a", "б": "b", "в": "v", "г": "g",
    "д": "d", "е": "e", "ё": "e", "ж": "zh",
    "з": "z", "и": "i", "й": "y", "к": "k",
    "л": "l", "м": "m", "н": "n", "о": "o",
    "п": "p", "р": "r", "с": "s", "т": "t",
    "у": "u", "ф": "f", "х": "h", "ц": "c",
    "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "",
    "ы": "y", "ь": "", "э": "e", "ю": "yu",
    "я": "ya",
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
    const selectedModules = Array.from(
      new Set([
        ...baseModules,
        ...data.modules,
        ...(data.needsTransfer ? [ModuleType.TRANSFER] : []),
      ]),
    ) as ModuleType[];
    const selectedTemplate = data.invitationTemplateId
      ? await prisma.invitationTemplate.findFirst({
          where: { id: data.invitationTemplateId, isActive: true },
          select: { content: true },
        })
      : null;
    const welcomeText =
      selectedTemplate?.content
        ?.replaceAll("{names}", `${data.partnerOneName} и ${data.partnerTwoName}`)
        .replaceAll("{partnerOne}", data.partnerOneName)
        .replaceAll("{partnerTwo}", data.partnerTwoName) ??
      `${data.partnerOneName} и ${data.partnerTwoName} приглашают вас разделить этот особенный день. Мы очень хотим, чтобы рядом были самые близкие люди.`;
    const session = getRequestSession(request);
    const sessionUser = session
      ? await prisma.user.findUnique({
          where: { id: session.userId },
          select: { id: true, email: true },
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
          templateStyle: data.templateStyle,
          musicTrackId: data.musicTrackId || null,
          designThemeId: data.designThemeId || null,
          audioUrl: data.audioUrl || null,
          pinCode: data.privateWedding ? "2026" : null,
          rsvpEnabled: true,
          personalLinks: data.personalLinks,
          defaultLanguage: "RU",
          data: {
            create: {
              partnerOneName: data.partnerOneName.trim(),
              partnerTwoName: data.partnerTwoName.trim(),
              weddingDate: new Date(`${data.weddingDate}T12:00:00.000Z`),
              ceremonyTime: data.ceremonyTime,
              welcomeText,
              dressCodeText: data.strictDressCode
                ? "Мы будем рады, если вы поддержите стиль свадьбы в спокойных и элегантных оттенках. Палитру можно уточнить в конструкторе."
                : null,
              timeline: JSON.stringify([
                { id: "arrival", time: "16:00", title: "Сбор гостей" },
                { id: "ceremony", time: data.ceremonyTime, title: "Церемония" },
                { id: "dinner", time: "18:00", title: "Ужин и танцы" },
              ]),
              transfer: data.needsTransfer
                ? JSON.stringify({
                    description: "Мы подготовим информацию о трансфере чуть позже.",
                    time: "",
                    meetingPoint: "",
                  })
                : null,
              colorPalette: JSON.stringify([
                "#E9E1D4",
                "#CDBBA7",
                "#9D8F7D",
                "#62675C",
                "#F7F3EA",
              ]),
              customContent: JSON.stringify({
                quizFeatures: {
                  privateWedding: data.privateWedding,
                  multilingualInvitation: data.multilingualInvitation,
                  postWeddingAutoEnabled: data.postWeddingAutoEnabled,
                  personalLinks: data.personalLinks,
                },
                postWeddingAutoEnabled: data.postWeddingAutoEnabled,
              }),
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
    if (sessionUser?.email) {
      const origin = new URL(request.url).origin;
      await sendWeddingWelcomeEmail({
        email: sessionUser.email,
        partnerOneName: data.partnerOneName.trim(),
        partnerTwoName: data.partnerTwoName.trim(),
        siteUrl: `${origin}/wedding/${site.slug}`,
        accountUrl: `${origin}/account`,
      }).catch((emailError) => {
        console.error("Failed to send welcome email", emailError);
      });
    }
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
