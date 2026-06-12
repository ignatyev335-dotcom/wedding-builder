import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const demoTemplates = [
  {
    title: "Тёплое приглашение",
    content:
      "{partnerOne} и {partnerTwo} с радостью приглашают вас разделить с нами самый нежный день нашей истории. Нам очень хочется обнять вас, танцевать вместе и сохранить этот вечер в памяти навсегда.",
  },
  {
    title: "Классический тон",
    content:
      "Дорогие гости! Приглашаем вас на торжество в честь свадьбы {partnerOne} и {partnerTwo}. Для нас будет большой радостью провести этот день рядом с вами.",
  },
  {
    title: "Лёгкий и современный",
    content:
      "Мы решили сказать друг другу «да» и будем счастливы, если вы будете рядом. {partnerOne} и {partnerTwo} ждут вас на празднике, где будет много любви, света и красивых моментов.",
  },
];

export async function POST() {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  try {
    const existingCount = await prisma.invitationTemplate.count();
    const createdTemplates = await Promise.all(
      demoTemplates.map((template, index) =>
        prisma.invitationTemplate.create({
          data: {
            ...template,
            isActive: true,
            sortOrder: existingCount + index,
          },
          select: {
            id: true,
            title: true,
            content: true,
            isActive: true,
            sortOrder: true,
          },
        }),
      ),
    );

    return NextResponse.json(
      { templates: createdTemplates },
      { status: 201 },
    );
  } catch (error) {
    console.error("Template demo seed failed", error);
    return NextResponse.json(
      { error: "Не удалось загрузить демо-шаблоны." },
      { status: 500 },
    );
  }
}
