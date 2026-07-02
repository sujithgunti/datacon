import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Strategy, StrategyOptionsWithoutRequest } from "passport-jwt";
import { Request } from "express";
import { RefreshTokenPayload } from "../token.types";

function fromCookie(req: Request): string | null {
  return req?.cookies?.refresh_token ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: fromCookie,
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_REFRESH_SECRET")!,
    } as StrategyOptionsWithoutRequest);
  }

  async validate(payload: RefreshTokenPayload): Promise<RefreshTokenPayload> {
    return payload;
  }
}
