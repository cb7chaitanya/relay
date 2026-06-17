-- DropIndex
DROP INDEX "Conversation_createdAt_idx";

-- AlterTable: add updatedAt with default for existing rows
ALTER TABLE "Conversation" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");
