CREATE TABLE "TelegramLoginTicket" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "telegramId" TEXT,
    "chatId" TEXT,
    "name" TEXT,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramLoginTicket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TelegramLoginTicket_tokenHash_key" ON "TelegramLoginTicket"("tokenHash");
CREATE INDEX "TelegramLoginTicket_status_expiresAt_idx" ON "TelegramLoginTicket"("status", "expiresAt");
CREATE INDEX "TelegramLoginTicket_userId_idx" ON "TelegramLoginTicket"("userId");

ALTER TABLE "TelegramLoginTicket"
ADD CONSTRAINT "TelegramLoginTicket_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
