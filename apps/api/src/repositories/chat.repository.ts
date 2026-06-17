import { Sender } from "@prisma/client";
import { prisma } from "../lib/prisma";

const TITLE_MAX_LENGTH = 40;

export async function createConversation(title?: string) {
  return prisma.conversation.create({
    data: {
      ...(title ? { title: title.slice(0, TITLE_MAX_LENGTH) } : {}),
    },
  });
}

export async function findConversationById(id: string) {
  return prisma.conversation.findUnique({ where: { id } });
}

export async function deleteConversation(id: string) {
  return prisma.conversation.delete({ where: { id } });
}

export async function listConversations() {
  return prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
}

export async function updateConversationTitle(id: string, title: string) {
  return prisma.conversation.update({
    where: { id },
    data: { title: title.slice(0, TITLE_MAX_LENGTH) },
  });
}

export async function createMessage(data: {
  conversationId: string;
  sender: Sender;
  text: string;
  promptTokens?: number;
  completionTokens?: number;
}) {
  const [message] = await prisma.$transaction([
    prisma.message.create({ data }),
    prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
  return message;
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
