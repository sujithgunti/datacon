import { SetMetadata } from "@nestjs/common";
import type { PermissionKey } from "@datacon/shared-types";

export const ANY_PERMISSIONS_KEY = "requiredAnyPermissions";
export const RequireAnyPermission = (...permissions: PermissionKey[]) => SetMetadata(ANY_PERMISSIONS_KEY, permissions);
