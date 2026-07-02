import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { PermissionKey } from "@datacon/shared-types";
import { PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";
import { ANY_PERMISSIONS_KEY } from "../decorators/require-any-permission.decorator";
import { AuthenticatedUser } from "../token.types";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionKey[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredAny = this.reflector.getAllAndOverride<PermissionKey[]>(ANY_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if ((!required || required.length === 0) && (!requiredAny || requiredAny.length === 0)) return true;

    const req = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = req.user;
    const has = (key: PermissionKey) => !!user?.permissions?.includes(key);

    const passesAll = !required || required.length === 0 || required.every(has);
    const passesAny = !requiredAny || requiredAny.length === 0 || requiredAny.some(has);

    if (!passesAll || !passesAny) {
      throw new ForbiddenException("You don't have permission to perform this action.");
    }
    return true;
  }
}
