import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Strategy, StrategyOptionsWithoutRequest } from "passport-jwt";
import { Request } from "express";
import { AccessTokenPayload, AuthenticatedUser } from "../token.types";

function fromCookie(req: Request): string | null {
  return req?.cookies?.access_token ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: fromCookie,
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_ACCESS_SECRET")!,
    } as StrategyOptionsWithoutRequest);
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    return { id: payload.sub, roleId: payload.roleId, permissions: payload.permissions };
  }
}
