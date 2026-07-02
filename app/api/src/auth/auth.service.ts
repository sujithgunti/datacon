import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AccessTokenPayload, RefreshTokenPayload } from "./token.types";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 min
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async userWithPermissions(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: { include: { permissions: true } } },
    });
    return {
      user,
      permissions: user.role.permissions.map((p) => p.permissionKey),
    };
  }

  private async issueTokens(userId: string): Promise<IssuedTokens> {
    const { user, permissions } = await this.userWithPermissions(userId);

    const accessPayload: AccessTokenPayload = { sub: user.id, roleId: user.roleId, permissions };
    const accessToken = this.jwt.sign(accessPayload, {
      secret: this.config.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });

    const jti = randomUUID();
    await this.prisma.refreshToken.create({
      data: {
        jti,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });

    const refreshPayload: RefreshTokenPayload = { sub: user.id, jti, tokenVersion: user.tokenVersion };
    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto): Promise<IssuedTokens> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists.");
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const initials = dto.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        initials: initials || "U",
        roleId: "viewer",
      },
    });
    return this.issueTokens(user.id);
  }

  async login(dto: LoginDto): Promise<IssuedTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException("Invalid email or password.");
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid email or password.");
    return this.issueTokens(user.id);
  }

  async refresh(payload: RefreshTokenPayload): Promise<IssuedTokens> {
    const stored = await this.prisma.refreshToken.findUnique({ where: { jti: payload.jti } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired, please sign in again.");
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException("Session expired, please sign in again.");
    }
    // rotate: revoke the used refresh token, issue a fresh pair
    await this.prisma.refreshToken.update({ where: { jti: payload.jti }, data: { revoked: true } });
    return this.issueTokens(user.id);
  }

  async logout(jti: string | undefined) {
    if (!jti) return;
    await this.prisma.refreshToken.updateMany({ where: { jti }, data: { revoked: true } }).catch(() => undefined);
  }

  /** Public quick-login roster shown on the login screen (demo personas only). */
  async personas() {
    const users = await this.prisma.user.findMany({
      where: { isCore: true },
      select: {
        id: true,
        name: true,
        title: true,
        initials: true,
        avatarGrad: true,
        roleId: true,
        role: { select: { name: true, colorHex: true, bgHex: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return users;
  }

  /** Demo-only: log straight in as a seeded persona without a password, matching the prototype's UX. */
  async quickLogin(personaId: string): Promise<IssuedTokens> {
    const user = await this.prisma.user.findUnique({ where: { id: personaId } });
    if (!user || !user.isCore) {
      throw new UnauthorizedException("Unknown demo persona.");
    }
    return this.issueTokens(user.id);
  }

  async me(userId: string) {
    const { user, permissions } = await this.userWithPermissions(userId);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      initials: user.initials,
      avatarGrad: user.avatarGrad,
      title: user.title,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions,
    };
  }
}
