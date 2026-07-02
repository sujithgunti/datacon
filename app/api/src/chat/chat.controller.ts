import { Body, Controller, Get, Param, Patch, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/token.types";
import { AiClientService } from "../common/ai-client.service";
import { MetricsService } from "../metrics/metrics.service";
import { ChatService } from "./chat.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { FeedbackDto } from "./dto/feedback.dto";

const DEFAULT_MODEL = "Holt-Winters";
const DEFAULT_HORIZON = 6;

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("chat")
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly metrics: MetricsService,
    private readonly ai: AiClientService,
  ) {}

  @Get("messages")
  async messages(@CurrentUser() user: AuthenticatedUser) {
    return this.chat.listMessages(user.id);
  }

  @RequirePermissions("ask_agents")
  @Post("stream")
  async stream(@Body() dto: SendMessageDto, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const conversation = await this.chat.getOrCreateConversation(user.id);
    await this.chat.appendUserMessage(conversation.id, dto.message);
    const context = await this.metrics.chatContext(DEFAULT_MODEL, DEFAULT_HORIZON);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const upstream = await this.ai.client.post(
      "/internal/chat/stream",
      { message: dto.message, context },
      { responseType: "stream" },
    );

    let buffer = "";
    let finalIntent = "descriptive";
    let finalText = "";
    let finalPayload: unknown = null;

    upstream.data.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      buffer += text;
      res.write(chunk);

      const doneMatch = buffer.match(/event: done\ndata: (.+)\n\n/);
      if (doneMatch) {
        try {
          const parsed = JSON.parse(doneMatch[1]);
          finalIntent = parsed.intent;
          finalText = parsed.text;
          finalPayload = parsed.payload;
        } catch {
          // ignore parse errors — the client already has the raw event either way
        }
      }
    });

    upstream.data.on("end", async () => {
      if (finalText) {
        await this.chat.appendAgentMessage(conversation.id, finalIntent, finalText, finalPayload);
      }
      res.end();
    });

    upstream.data.on("error", () => res.end());
  }

  @Patch("messages/:id/feedback")
  async feedback(@Param("id") id: string, @Body() dto: FeedbackDto, @CurrentUser() user: AuthenticatedUser) {
    return this.chat.setFeedback(id, user.id, dto.vote);
  }
}
