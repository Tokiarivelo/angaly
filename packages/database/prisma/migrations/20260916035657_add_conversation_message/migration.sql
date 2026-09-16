-- CreateEnum
CREATE TYPE "MessageSenderRole" AS ENUM ('CLIENT', 'STAFF');

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "atelierId" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "lastMessagePreview" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderRole" "MessageSenderRole" NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_customerId_lastMessageAt_idx" ON "conversations"("customerId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_customerId_atelierId_key" ON "conversations"("customerId", "atelierId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_atelierId_fkey" FOREIGN KEY ("atelierId") REFERENCES "ateliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
