import { Injectable, NotFoundException } from "@nestjs/common";
import { Intent } from "@datacon/prisma";
import { PrismaService } from "../prisma/prisma.service";

const INTENT_MAP: Record<string, Intent> = {
  descriptive: "DESCRIPTIVE",
  diagnostic: "DIAGNOSTIC",
  predictive: "PREDICTIVE",
  prescriptive: "PRESCRIPTIVE",
};

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateConversation(userId: string) {
    const existing = await this.prisma.conversation.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
    if (existing) return existing;
    return this.prisma.conversation.create({ data: { userId, title: "Chat" } });
  }

  async listMessages(userId: string) {
    const conversation = await this.getOrCreateConversation(userId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      include: { feedback: true },
    });
    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      intent: m.intent?.toLowerCase() ?? null,
      text: m.text,
      payload: m.payload,
      vote: m.feedback?.vote ?? 0,
      createdAt: m.createdAt,
    }));
  }

  async appendUserMessage(conversationId: string, text: string) {
    return this.prisma.message.create({ data: { conversationId, role: "user", text } });
  }

  async appendAgentMessage(conversationId: string, intent: string, text: string, payload: unknown) {
    return this.prisma.message.create({
      data: { conversationId, role: "agent", intent: INTENT_MAP[intent], text, payload: payload as any },
    });
  }

  async setFeedback(messageId: string, userId: string, vote: -1 | 0 | 1) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException("Message not found.");
    if (vote === 0) {
      await this.prisma.feedback.deleteMany({ where: { messageId } });
      return { vote: 0 };
    }
    await this.prisma.feedback.upsert({
      where: { messageId },
      update: { vote, userId },
      create: { messageId, userId, vote },
    });
    return { vote };
  }
}
