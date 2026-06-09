import type { Metadata } from "next";

import { CookieBanner } from "@/features/legal/ui/cookie-banner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Vowly — свадебный сайт за несколько минут",
  description: "Создайте красивое свадебное приглашение без страха чистого листа.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Global App Router font stylesheet; runtime loading keeps local builds offline-safe. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cormorant+Garamond:wght@300..700&family=Great+Vibes&family=Montserrat:wght@100..900&family=Pinyon+Script&family=Playfair+Display:wght@400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
