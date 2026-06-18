CREATE TABLE "PromoCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "discountPercent" INTEGER NOT NULL,
  "targetPlan" "MonetizationPlan" NOT NULL DEFAULT 'PREMIUM',
  "maxRedemptions" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX "PromoCode_isActive_targetPlan_idx" ON "PromoCode"("isActive", "targetPlan");
CREATE INDEX "PromoCode_expiresAt_idx" ON "PromoCode"("expiresAt");
