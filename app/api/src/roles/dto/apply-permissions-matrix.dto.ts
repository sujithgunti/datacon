import { IsObject } from "class-validator";
import type { PermissionKey } from "@datacon/shared-types";

export class ApplyPermissionsMatrixDto {
  @IsObject()
  matrix!: Record<string, PermissionKey[]>;
}
