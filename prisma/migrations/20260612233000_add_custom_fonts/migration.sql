-- AlterTable
ALTER TABLE "DesignTheme" ADD COLUMN "customFontId" TEXT;

-- CreateTable
CREATE TABLE "CustomFont" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'woff2',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFont_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomFont_name_key" ON "CustomFont"("name");

-- CreateIndex
CREATE INDEX "CustomFont_isActive_createdAt_idx" ON "CustomFont"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "DesignTheme_customFontId_idx" ON "DesignTheme"("customFontId");

-- AddForeignKey
ALTER TABLE "DesignTheme" ADD CONSTRAINT "DesignTheme_customFontId_fkey"
FOREIGN KEY ("customFontId") REFERENCES "CustomFont"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
