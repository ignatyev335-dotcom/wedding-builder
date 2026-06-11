CREATE TABLE "DesignTheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "textColor" TEXT NOT NULL,
    "fontFamily" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DesignTheme_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DesignTheme_name_key" ON "DesignTheme"("name");
CREATE INDEX "DesignTheme_createdAt_idx" ON "DesignTheme"("createdAt");

ALTER TABLE "WeddingSite" ADD COLUMN "designThemeId" TEXT;
CREATE INDEX "WeddingSite_designThemeId_idx" ON "WeddingSite"("designThemeId");

ALTER TABLE "WeddingSite"
ADD CONSTRAINT "WeddingSite_designThemeId_fkey"
FOREIGN KEY ("designThemeId") REFERENCES "DesignTheme"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
