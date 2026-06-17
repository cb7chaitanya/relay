import { Sender } from "@prisma/client";
import {
  createConversation,
  createMessage,
  deleteConversation,
  findConversationById,
  findMessagesByConversationId,
  getRecentMessages,
  listConversations,
  updateConversationTitle,
} from "../repositories/chat.repository";
import { llmProvider } from "../providers/instance";
import type { LLMMessage } from "../providers/types";
import { SYSTEM_PROMPT } from "../constants/support-context";
import { NotFoundError } from "../errors";
import { logger } from "../lib/logger";
import { Sender as SharedSender, type MessageDTO } from "@relay/shared";

const CONTEXT_MESSAGE_LIMIT = 10;

export type ChatEvent =
  | { event: "session"; data: { sessionId: string } }
  | { event: "token"; data: { token: string } }
  | {
      event: "done";
      data: { promptTokens: number | null; completionTokens: number | null };
    };

function toProviderRole(sender: Sender): "user" | "assistant" {
  return sender === Sender.USER ? "user" : "assistant";
}

function toSharedSender(sender: Sender): SharedSender {
  return sender === Sender.USER ? SharedSender.USER : SharedSender.ASSISTANT;
}

function toMessageDTO(message: {
  id: string;
  conversationId: string;
  sender: Sender;
  text: string;
  createdAt: Date;
}): MessageDTO {
  return {
    id: message.id,
    conversationId: message.conversationId,
    sender: toSharedSender(message.sender),
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function* handleChatMessage(
  message: string,
  sessionId: string | undefined,
  requestId?: string,
): AsyncGenerator<ChatEvent> {
  const isNew = !sessionId;
  const conversation = isNew
    ? await createConversation(message)
    : await resolveConversation(sessionId);

  if (!isNew && !conversation.title) {
    await updateConversationTitle(conversation.id, message).catch(() => {});
  }

  logger.info("Processing chat message", {
    requestId,
    sessionId: conversation.id,
    isNew,
  });

  yield { event: "session", data: { sessionId: conversation.id } };

  await createMessage({
    conversationId: conversation.id,
    sender: Sender.USER,
    text: message,
  });

  const recentMessages = await getRecentMessages(
    conversation.id,
    CONTEXT_MESSAGE_LIMIT,
  );

  const llmMessages: LLMMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...recentMessages.map((m) => ({
      role: toProviderRole(m.sender) as "user" | "assistant",
      content: m.text,
    })),
  ];

  let fullText = "";
  let promptTokens: number | null = null;
  let completionTokens: number | null = null;
  let streamCompleted = false;

  try {
    for await (const chunk of llmProvider.streamResponse(llmMessages)) {
      if (chunk.type === "token") {
        fullText += chunk.token;
        yield { event: "token", data: { token: chunk.token } };
      } else {
        promptTokens = chunk.usage?.promptTokens ?? null;
        completionTokens = chunk.usage?.completionTokens ?? null;
        streamCompleted = true;
        logger.info("LLM completion finished", {
          requestId,
          promptTokens,
          completionTokens,
        });
      }
    }
  } catch (err) {
    if (!streamCompleted) {
      logger.warn("LLM stream failed, skipping assistant message persistence", {
        requestId,
      });
    }
    throw err;
  }

  if (!streamCompleted) return;

  await createMessage({
    conversationId: conversation.id,
    sender: Sender.ASSISTANT,
    text: fullText,
    ...(promptTokens != null ? { promptTokens } : {}),
    ...(completionTokens != null ? { completionTokens } : {}),
  });

  yield { event: "done", data: { promptTokens, completionTokens } };
}

export async function getSessions() {
  const conversations = await listConversations();
  return conversations.map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updatedAt.toISOString(),
    messageCount: c._count.messages,
  }));
}

export async function getSession(sessionId: string): Promise<{
  sessionId: string;
  messages: MessageDTO[];
}> {
  const conversation = await resolveConversation(sessionId);
  const messages = await findMessagesByConversationId(conversation.id);
  return {
    sessionId: conversation.id,
    messages: messages.map(toMessageDTO),
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await resolveConversation(sessionId);
  await deleteConversation(sessionId);
}

async function resolveConversation(sessionId: string) {
  const conversation = await findConversationById(sessionId);
  if (!conversation) {
    throw new NotFoundError("Session not found");
  }
  return conversation;
}
