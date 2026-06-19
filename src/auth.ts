import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AuthProvider, UserRole } from "@prisma/client";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Yandex from "next-auth/providers/yandex";
import { z } from "zod";

import { verifyPassword } from "@/lib/auth/password";
import {
  type TelegramLoginPayload,
  verifyTelegramLogin,
} from "@/lib/auth/telegram";
import { prisma } from "@/lib/prisma";
import { getRuntimeSetting } from "@/lib/runtime-settings";

const passwordSchema = z.object({
  email: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
});

const telegramSchema = z.object({
  id: z.string().min(1),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().url().optional(),
  auth_date: z.string(),
  hash: z.string().min(1),
});

class AuthTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthTimeoutError";
  }
}

async function withAuthTimeout<T>(operation: Promise<T>, timeoutMs = 8000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new AuthTimeoutError("Authentication timed out."));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "password",
    name: "Email и пароль",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Пароль", type: "password" },
    },
    async authorize(credentials) {
      try {
        const parsed = passwordSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const adminEmail = (
          process.env.ADMIN_EMAIL ??
          (process.env.NODE_ENV !== "production" ? "admin@vowly.ru" : "")
        )
          .trim()
          .toLowerCase();
        const adminPassword =
          process.env.ADMIN_PASSWORD ??
          (process.env.NODE_ENV !== "production" ? "VowlyAdmin2026!" : "");
        const isAdminBootstrap =
          Boolean(adminEmail && adminPassword) &&
          email === adminEmail &&
          password === adminPassword;

        let user = await withAuthTimeout(
          prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              role: true,
              passwordHash: true,
            },
          }),
        );

        if (user?.passwordHash) {
          const validPassword = await verifyPassword(password, user.passwordHash);
          if (!validPassword) return null;
        } else if (!isAdminBootstrap) {
          return null;
        }

        if (user && isAdminBootstrap && user.role !== "ADMIN") {
          user = await withAuthTimeout(
            prisma.user.update({
              where: { id: user.id },
              data: { role: "ADMIN" },
              select: {
                id: true,
                email: true,
                name: true,
                image: true,
                role: true,
                passwordHash: true,
              },
            }),
          );
        }

        if (!user) {
          return null;
        }

        return toAuthUser(user);
      } catch (error) {
        console.error("Password authorize failed", error);
        return null;
      }
    },
  }),
  Credentials({
    id: "telegram",
    name: "Telegram",
    credentials: {
      id: { label: "Telegram ID", type: "text" },
      first_name: { label: "Имя", type: "text" },
      last_name: { label: "Фамилия", type: "text" },
      username: { label: "Username", type: "text" },
      photo_url: { label: "Фото", type: "text" },
      auth_date: { label: "Дата авторизации", type: "text" },
      hash: { label: "Подпись", type: "text" },
    },
    async authorize(credentials) {
      try {
        const parsed = telegramSchema.safeParse(credentials);
        const botToken = await getRuntimeSetting("TELEGRAM_BOT_TOKEN");
        if (
          !parsed.success ||
          !botToken ||
          !verifyTelegramLogin(parsed.data as TelegramLoginPayload, botToken)
        ) {
          return null;
        }

        const profile = parsed.data;
        const user = await withAuthTimeout(
          prisma.user.upsert({
            where: { telegramId: profile.id },
            update: {
              name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
              image: profile.photo_url,
              provider: "TELEGRAM",
            },
            create: {
              telegramId: profile.id,
              name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
              image: profile.photo_url,
              provider: "TELEGRAM",
            },
          }),
        );

        return toAuthUser(user);
      } catch (error) {
        console.error("Telegram authorize failed", error);
        return null;
      }
    },
  }),
];


if (process.env.AUTH_YANDEX_ID && process.env.AUTH_YANDEX_SECRET) {
  providers.unshift(
    Yandex({
      clientId: process.env.AUTH_YANDEX_ID,
      clientSecret: process.env.AUTH_YANDEX_SECRET,
    }),
  );
}


export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 365,
    updateAge: 60 * 60 * 24 * 7,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 365,
  },
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.email = user.email ?? token.email;
        token.role = (user as typeof user & { role?: UserRole }).role ?? "USER";
      }

      if (token.sub && !token.role) {
        try {
          const dbUser = await withAuthTimeout(
            prisma.user.findUnique({
              where: { id: token.sub },
              select: { role: true, email: true },
            }),
          );
          token.role = dbUser?.role ?? "USER";
          token.email = dbUser?.email ?? token.email;
        } catch (error) {
          console.error("JWT role hydration failed", error);
          token.role = "USER";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email ?? session.user.email;
        (session.user as typeof session.user & { role: UserRole }).role =
          (token.role as UserRole | undefined) ?? "USER";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const target = new URL(url);
        return target.origin === baseUrl ? target.toString() : baseUrl;
      } catch {
        return baseUrl;
      }
    },
    async signIn({ user, account }) {
      if (!user.id || !account) return true;

      const provider = authProviderByAccount(account.provider);
      const isConfiguredAdmin =
        Boolean(user.email) &&
        user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();

      if (provider || isConfiguredAdmin) {
        try {
          await withAuthTimeout(
            prisma.user.update({
              where: { id: user.id },
              data: {
                ...(provider ? { provider } : {}),
                ...(isConfiguredAdmin ? { role: "ADMIN" as const } : {}),
              },
            }),
          );
        } catch (error) {
          console.error("signIn role sync failed", error);
        }
      }

      return true;
    },
  },
});

function authProviderByAccount(provider: string): AuthProvider | null {
  if (provider === "yandex") return "YANDEX";
  if (provider === "telegram") return "TELEGRAM";
  if (provider === "password") return "EMAIL";
  return null;
}

function toAuthUser(user: {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  };
}


