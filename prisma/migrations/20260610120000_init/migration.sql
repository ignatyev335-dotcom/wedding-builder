-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('TELEGRAM', 'VK', 'YANDEX', 'EMAIL', 'ANONYMOUS');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ThemeCode" AS ENUM ('MINIMAL', 'BOHO', 'CLASSIC', 'MODERN', 'ROMANTIC', 'BOTANICAL', 'EDITORIAL');

-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('HERO', 'STORY', 'RSVP', 'DRESS_CODE', 'TIMELINE', 'TRANSFER', 'MAP', 'MUSIC', 'GALLERY', 'COUNTDOWN', 'FAQ');

-- CreateEnum
CREATE TYPE "GuestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "TransportPreference" AS ENUM ('TRANSFER', 'OWN_CAR', 'SELF');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PremiumFeature" AS ENUM ('REMOVE_BRANDING', 'PREMIUM_THEMES', 'RSVP', 'TELEGRAM_NOTIFICATIONS', 'PERSONAL_LINKS', 'PREMIUM_MUSIC', 'GALLERY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT,
    "telegramChatId" TEXT,
    "email" TEXT,
    "name" TEXT,
    "provider" "AuthProvider" NOT NULL DEFAULT 'ANONYMOUS',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingSite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "theme" "ThemeCode" NOT NULL DEFAULT 'MINIMAL',
    "status" "SiteStatus" NOT NULL DEFAULT 'DRAFT',
    "musicTrackId" TEXT,
    "heroImageDesktop" TEXT,
    "heroImageMobile" TEXT,
    "giftPaymentLink" TEXT,
    "giftQrCode" TEXT,
    "pinCode" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'RU',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "removeBranding" BOOLEAN NOT NULL DEFAULT false,
    "rsvpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramAlerts" BOOLEAN NOT NULL DEFAULT false,
    "personalLinks" BOOLEAN NOT NULL DEFAULT false,
    "premiumMusic" BOOLEAN NOT NULL DEFAULT false,
    "galleryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeddingSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingData" (
    "id" TEXT NOT NULL,
    "weddingSiteId" TEXT NOT NULL,
    "partnerOneName" TEXT NOT NULL,
    "partnerTwoName" TEXT NOT NULL,
    "weddingDate" TIMESTAMP(3) NOT NULL,
    "ceremonyTime" TEXT,
    "venueName" TEXT,
    "venueAddress" TEXT,
    "mapLatitude" DOUBLE PRECISION,
    "mapLongitude" DOUBLE PRECISION,
    "welcomeText" TEXT,
    "dressCodeText" TEXT,
    "colorPalette" TEXT,
    "dressMoodboard" TEXT,
    "faqItems" TEXT,
    "coordinatorName" TEXT,
    "coordinatorRole" TEXT,
    "coordinatorPhoto" TEXT,
    "coordinatorTelegram" TEXT,
    "coordinatorWhatsapp" TEXT,
    "coordinatorPhone" TEXT,
    "coordinatorMapLink" TEXT,
    "photoMask" TEXT DEFAULT 'RECTANGLE',
    "customQuestions" TEXT,
    "timeline" TEXT,
    "transfer" TEXT,
    "customContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeddingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewTiming" (
    "id" TEXT NOT NULL,
    "weddingSiteId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewTiming_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteModule" (
    "id" TEXT NOT NULL,
    "weddingSiteId" TEXT NOT NULL,
    "type" "ModuleType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "settings" TEXT,

    CONSTRAINT "SiteModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "weddingSiteId" TEXT NOT NULL,
    "customSlug" TEXT,
    "guestName" TEXT NOT NULL,
    "isCouple" BOOLEAN NOT NULL DEFAULT false,
    "partnerName" TEXT,
    "attendanceChoice" TEXT,
    "phone" TEXT NOT NULL,
    "attendance" "GuestStatus" NOT NULL DEFAULT 'PENDING',
    "magicToken" TEXT NOT NULL,
    "alcoholPreferences" TEXT NOT NULL DEFAULT '[]',
    "needsTransport" BOOLEAN NOT NULL DEFAULT false,
    "transportPreference" "TransportPreference",
    "dietaryRestrictions" TEXT,
    "foodPreference" TEXT,
    "partnerFoodPreference" TEXT,
    "allergies" TEXT,
    "partnerAllergies" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "customAnswers" TEXT NOT NULL DEFAULT '{}',
    "hasPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "plusOneName" TEXT,
    "musicRequest" TEXT,
    "message" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weddingSiteId" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "amountKopecks" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "features" TEXT NOT NULL DEFAULT '[]',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "LoginCode_email_expiresAt_idx" ON "LoginCode"("email", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingSite_slug_key" ON "WeddingSite"("slug");

-- CreateIndex
CREATE INDEX "WeddingSite_userId_idx" ON "WeddingSite"("userId");

-- CreateIndex
CREATE INDEX "WeddingSite_status_createdAt_idx" ON "WeddingSite"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingData_weddingSiteId_key" ON "WeddingData"("weddingSiteId");

-- CreateIndex
CREATE INDEX "CrewTiming_weddingSiteId_sortOrder_idx" ON "CrewTiming"("weddingSiteId", "sortOrder");

-- CreateIndex
CREATE INDEX "SiteModule_weddingSiteId_isEnabled_idx" ON "SiteModule"("weddingSiteId", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "SiteModule_weddingSiteId_type_key" ON "SiteModule"("weddingSiteId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "SiteModule_weddingSiteId_sortOrder_key" ON "SiteModule"("weddingSiteId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_magicToken_key" ON "Guest"("magicToken");

-- CreateIndex
CREATE INDEX "Guest_weddingSiteId_attendance_idx" ON "Guest"("weddingSiteId", "attendance");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_weddingSiteId_customSlug_key" ON "Guest"("weddingSiteId", "customSlug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_providerPaymentId_key" ON "Order"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_weddingSiteId_status_idx" ON "Order"("weddingSiteId", "status");

-- AddForeignKey
ALTER TABLE "WeddingSite" ADD CONSTRAINT "WeddingSite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingData" ADD CONSTRAINT "WeddingData_weddingSiteId_fkey" FOREIGN KEY ("weddingSiteId") REFERENCES "WeddingSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewTiming" ADD CONSTRAINT "CrewTiming_weddingSiteId_fkey" FOREIGN KEY ("weddingSiteId") REFERENCES "WeddingSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteModule" ADD CONSTRAINT "SiteModule_weddingSiteId_fkey" FOREIGN KEY ("weddingSiteId") REFERENCES "WeddingSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_weddingSiteId_fkey" FOREIGN KEY ("weddingSiteId") REFERENCES "WeddingSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_weddingSiteId_fkey" FOREIGN KEY ("weddingSiteId") REFERENCES "WeddingSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
