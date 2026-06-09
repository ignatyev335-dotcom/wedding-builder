import type { Metadata } from "next";
import {
  Bad_Script,
  Caveat,
  Cormorant_Garamond,
  Marck_Script,
  Montserrat,
  Oranienbaum,
  Playfair_Display,
} from "next/font/google";

import { CookieBanner } from "@/features/legal/ui/cookie-banner";

import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const marck = Marck_Script({
  variable: "--font-marck",
  subsets: ["cyrillic", "latin"],
  weight: "400",
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const badScript = Bad_Script({
  variable: "--font-bad-script",
  subsets: ["cyrillic", "latin"],
  weight: "400",
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

const oranienbaum = Oranienbaum({
  variable: "--font-oranienbaum",
  subsets: ["cyrillic", "latin"],
  weight: "400",
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

const fontVariables = [
  cormorant.variable,
  marck.variable,
  caveat.variable,
  badScript.variable,
  montserrat.variable,
  oranienbaum.variable,
  playfair.variable,
].join(" ");

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
    <html lang="ru" className={fontVariables}>
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
