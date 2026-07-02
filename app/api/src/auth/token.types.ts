export interface AccessTokenPayload {
  sub: string;
  roleId: string;
  permissions: string[];
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  tokenVersion: number;
}

export interface AuthenticatedUser {
  id: string;
  roleId: string;
  permissions: string[];
}
