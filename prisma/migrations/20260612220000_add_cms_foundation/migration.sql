CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PREMIUM', 'VIP');
CREATE TYPE "MediaAssetType" AS ENUM ('ICON', 'STICKER');

ALTER TABLE "User"
ADD COLUMN "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE';

CREATE TABLE "PlatformContent" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "greetingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "timelineEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dressCodeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "mapEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rsvpEnabled" BOOLEAN NOT NULL DEFAULT true,
    "primaryButtonText" TEXT NOT NULL DEFAULT 'Отправить ответ',
    "footerText" TEXT NOT NULL DEFAULT 'Создано на Vowly',
    "errorText" TEXT NOT NULL DEFAULT 'Что-то пошло не так. Попробуйте ещё раз.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MediaAssetType" NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MediaAsset_type_isActive_idx" ON "MediaAsset"("type", "isActive");
CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");

ALTER TABLE "WeddingSite" ADD COLUMN "decorativeAssetId" TEXT;
CREATE INDEX "WeddingSite_decorativeAssetId_idx" ON "WeddingSite"("decorativeAssetId");
ALTER TABLE "WeddingSite"
ADD CONSTRAINT "WeddingSite_decorativeAssetId_fkey"
FOREIGN KEY ("decorativeAssetId") REFERENCES "MediaAsset"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "PlatformContent" ("id", "updatedAt")
VALUES ('global', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
