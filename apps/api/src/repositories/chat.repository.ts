import { Sender } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function createConversation() {
  return prisma.conversation.create({ data: {} });
}

export async function findConversationById(id: string) {
  return prisma.conversation.findUnique({ where: { id } });
}

export async function deleteConversation(id: string) {
  return prisma.conversation.delete({ where: { id } });
}

export async function createMessage(data: {
  conversationId: string;
  sender: Sender;
  text: string;
  promptTokens?: number;
  completionTokens?: number;
}) {
  return prisma.message.create({ data });
}

export async function findMessagesByConversationId(
  conversationId: string,
  options?: { limit?: number; orderBy?: "asc" | "desc" },
) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: options?.orderBy ?? "asc" },
    ...(options?.limit ? { take: options.limit } : {}),
  });
}

export async function getRecentMessages(
  conversationId: string,
  limit: number,
) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return messages.reverse();
}
