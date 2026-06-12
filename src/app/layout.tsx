import type { Metadata } from "next";

import { CookieBanner } from "@/features/legal/ui/cookie-banner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Vowly - свадебный сайт за несколько минут",
  description:
    "Создайте красивое свадебное приглашение без страха чистого листа.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
