CREATE TABLE "AudioTrack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AudioTrack_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvitationTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InvitationTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AudioTrack_isActive_sortOrder_idx" ON "AudioTrack"("isActive", "sortOrder");
CREATE INDEX "InvitationTemplate_isActive_sortOrder_idx" ON "InvitationTemplate"("isActive", "sortOrder");

UPDATE "WeddingSite" SET "musicTrackId" = NULL WHERE "musicTrackId" IS NOT NULL;

ALTER TABLE "WeddingSite"
ADD CONSTRAINT "WeddingSite_musicTrackId_fkey"
FOREIGN KEY ("musicTrackId") REFERENCES "AudioTrack"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
