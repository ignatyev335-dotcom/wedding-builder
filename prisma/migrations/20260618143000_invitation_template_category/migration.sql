ALTER TABLE "InvitationTemplate" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'classic';

CREATE INDEX "InvitationTemplate_category_isActive_sortOrder_idx" ON "InvitationTemplate"("category", "isActive", "sortOrder");
