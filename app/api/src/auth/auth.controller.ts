import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request, Response } from "express";
import { AuthService, ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS, IssuedTokens } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { AuthenticatedUser, RefreshTokenPayload } from "./token.types";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  private setCookies(res: Response, tokens: IssuedTokens) {
    const isProd = this.config.get("NODE_ENV") === "production";
    res.cookie("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
      path: "/",
    });
    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
      path: "/api/auth",
    });
  }

  private clearCookies(res: Response) {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/api/auth" });
  }

  @Get("personas")
  personas() {
    return this.auth.personas();
  }

  @Post("quick-login")
  @HttpCode(200)
  async quickLogin(@Body("personaId") personaId: string, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.quickLogin(personaId);
    this.setCookies(res, tokens);
    return { ok: true };
  }

  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.register(dto);
    this.setCookies(res, tokens);
    return { ok: true };
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.login(dto);
    this.setCookies(res, tokens);
    return { ok: true };
  }

  @UseGuards(JwtRefreshGuard)
  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const payload = req.user as RefreshTokenPayload;
    const tokens = await this.auth.refresh(payload);
    this.setCookies(res, tokens);
    return { ok: true };
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.refresh_token;
    if (raw) {
      try {
        const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(raw, {
          secret: this.config.get<string>("JWT_REFRESH_SECRET"),
        });
        await this.auth.logout(payload.jti);
      } catch {
        // ignore invalid/expired token on logout — cookies get cleared regardless
      }
    }
    this.clearCookies(res);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.me(user.id);
  }
}
