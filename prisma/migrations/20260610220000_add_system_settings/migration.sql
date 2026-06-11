CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "value" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");
CREATE INDEX "SystemSetting_category_idx" ON "SystemSetting"("category");
