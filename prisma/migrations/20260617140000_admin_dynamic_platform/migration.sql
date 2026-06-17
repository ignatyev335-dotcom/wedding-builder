CREATE TYPE "MonetizationPlan" AS ENUM ('FREE', 'PREMIUM', 'VIP');

ALTER TABLE "DesignTheme" ADD COLUMN "gradientCss" TEXT;

CREATE TABLE "MonetizationFeature" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "plan" "MonetizationPlan" NOT NULL DEFAULT 'FREE',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MonetizationFeature_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MonetizationFeature_code_key" ON "MonetizationFeature"("code");
CREATE INDEX "MonetizationFeature_plan_sortOrder_idx" ON "MonetizationFeature"("plan", "sortOrder");
