import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isSiteOwnerOrAdmin } from "@/lib/auth/session";

const statusLabels = {
  PENDING: "Ждем ответа",
  ACCEPTED: "Придет",
  DECLINED: "Отказ",
} as const;

const alcoholLabels: Record<string, string> = {
  WINE: "Вино",
  CHAMPAGNE: "Шампанское",
  STRONG: "Крепкий алкоголь",
  NONE: "Не пьет",
};

const transportLabels = {
  TRANSFER: "Нужен трансфер",
  OWN_CAR: "Своя машина",
  SELF: "Доберется самостоятельно",
} as const;

function cell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const user = await getCurrentUser();
  if (!user || !(await isSiteOwnerOrAdmin(user, siteId))) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }
  const site = await prisma.weddingSite.findUnique({
    where: { id: siteId },
    select: {
      slug: true,
      guests: { orderBy: { createdAt: "asc" } },
      data: { select: { customQuestions: true } },
    },
  });

  if (!site) {
    return NextResponse.json({ error: "Проект не найден." }, { status: 404 });
  }

  let questionTitles: Record<string, string> = {};
  try {
    const questions = JSON.parse(site.data?.customQuestions ?? "[]") as Array<{
      id: string;
      title: string;
    }>;
    questionTitles = Object.fromEntries(
      questions.map((question) => [question.id, question.title]),
    );
  } catch {
    questionTitles = {};
  }

  const rows = site.guests.map((guest) => {
    let alcohol: string[] = [];
    let tags: string[] = [];
    let customAnswers: Record<string, string> = {};

    try {
      alcohol = JSON.parse(guest.alcoholPreferences) as string[];
    } catch {
      alcohol = [];
    }
    try {
      tags = JSON.parse(guest.tags) as string[];
    } catch {
      tags = [];
    }
    try {
      customAnswers = JSON.parse(guest.customAnswers) as Record<string, string>;
    } catch {
      customAnswers = {};
    }

    return [
      guest.name,
      guest.isCouple ? guest.partnerName ?? "" : guest.plusOneName ?? "",
      guest.phone,
      statusLabels[guest.status],
      guest.attendanceChoice ?? "",
      guest.foodPreference ?? "",
      guest.allergies ?? "",
      guest.partnerFoodPreference ?? "",
      guest.partnerAllergies ?? "",
      alcohol.map((item) => alcoholLabels[item] ?? item).join(", "),
      guest.transportPreference
        ? transportLabels[guest.transportPreference]
        : guest.needsTransport
          ? "Нужен трансфер"
          : "",
      guest.musicRequest ?? "",
      tags.join(", "),
      Object.entries(customAnswers)
        .map(
          ([question, answer]) =>
            `${questionTitles[question] || question}: ${answer}`,
        )
        .join(" | "),
    ];
  });
  const headers = [
    "Имя",
    "Второй гость / спутник",
    "Телефон",
    "Статус",
    "Кто придет",
    "Еда",
    "Аллергии",
    "Меню второго гостя",
    "Аллергии второго гостя",
    "Напитки",
    "Транспорт",
    "Трек для танцев",
    "Теги",
    "Ответы на свои вопросы",
  ];
  const csv = [headers, ...rows]
    .map((row) => row.map(cell).join(";"))
    .join("\r\n");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vowly-${site.slug}-guests.csv"`,
    },
  });
}
