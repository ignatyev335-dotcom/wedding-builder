import { NextResponse } from "next/server";

import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
} from "@/lib/auth/admin-session";
import { setSessionCookie } from "@/lib/auth/session";
import { hashTelegramLoginToken } from "@/lib/auth/telegram-login-ticket";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";

  if (!token) {
    return NextResponse.json({ error: "Токен входа не найден." }, { status: 400 });
  }

  const ticket = await prisma.telegramLoginTicket.findUnique({
    where: { tokenHash: hashTelegramLoginToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ status: "EXPIRED" }, { status: 404 });
  }

  if (ticket.expiresAt < new Date() && ticket.status !== "CONFIRMED") {
    await prisma.telegramLoginTicket.update({
      where: { id: ticket.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ status: "EXPIRED" }, { status: 410 });
  }

  if (ticket.status !== "CONFIRMED" || !ticket.user) {
    return NextResponse.json({ status: "PENDING" });
  }

  const isAdmin = ticket.user.role === "ADMIN";
  const response = NextResponse.json({
    status: "CONFIRMED",
    redirectTo: isAdmin ? "/admin/dashboard" : "/account",
  });

  setSessionCookie(response, ticket.user.id);

  if (isAdmin) {
    setAdminSessionCookie(response, {
      id: ticket.user.id,
      email: ticket.user.email ?? "admin@vowly.ru",
    });
  } else {
    clearAdminSessionCookie(response);
  }

  return response;
}
