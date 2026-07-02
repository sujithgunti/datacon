import { ArrayNotEmpty, IsArray, IsString, MinLength } from "class-validator";
import type { PermissionKey } from "@datacon/shared-types";

export class CreateRoleDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  colorHex!: string;

  @IsArray()
  @ArrayNotEmpty()
  permissions!: PermissionKey[];
}
