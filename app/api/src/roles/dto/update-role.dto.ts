import { IsArray, IsOptional, IsString, MinLength } from "class-validator";
import type { PermissionKey } from "@datacon/shared-types";

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  colorHex?: string;

  @IsOptional()
  @IsArray()
  permissions?: PermissionKey[];
}
