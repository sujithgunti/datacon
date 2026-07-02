import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

function deriveBg(colorHex: string): string | null {
  if (/^#([0-9a-f]{6})$/i.test(colorHex)) return `${colorHex}1f`; // ~12% alpha tint
  return null; // non-hex (e.g. a CSS var) — frontend derives a tint via color-mix()
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      permissions: { select: { permissionKey: true } },
      _count: { select: { users: true } },
    } as const;
  }

  private shape(role: any) {
    return {
      id: role.id,
      name: role.name,
      colorHex: role.colorHex,
      bgHex: role.bgHex,
      isSystem: role.isSystem,
      permissions: role.permissions.map((p: any) => p.permissionKey),
      userCount: role._count.users,
    };
  }

  async list() {
    const roles = await this.prisma.role.findMany({ include: this.include(), orderBy: { createdAt: "asc" } });
    return roles.map((r) => this.shape(r));
  }

  async create(dto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        colorHex: dto.colorHex,
        bgHex: deriveBg(dto.colorHex),
        isSystem: false,
        permissions: { create: dto.permissions.map((key) => ({ permissionKey: key })) },
      },
      include: this.include(),
    });
    return this.shape(role);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException("Role not found.");

    if (dto.permissions) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      await this.prisma.rolePermission.createMany({
        data: dto.permissions.map((key) => ({ roleId: id, permissionKey: key })),
      });
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        colorHex: dto.colorHex,
        bgHex: dto.colorHex ? deriveBg(dto.colorHex) : undefined,
      },
      include: this.include(),
    });
    return this.shape(updated);
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id }, include: this.include() });
    if (!role) throw new NotFoundException("Role not found.");
    if (role.isSystem) {
      throw new ForbiddenException("System roles can't be deleted.");
    }
    if (role._count.users > 0) {
      throw new ConflictException(`${role.name} is assigned to ${role._count.users} user(s). Reassign them first.`);
    }
    await this.prisma.role.delete({ where: { id } });
    return { ok: true };
  }

  async applyPermissionsMatrix(matrix: Record<string, string[]>) {
    const roleIds = Object.keys(matrix);
    const existing = await this.prisma.role.findMany({ where: { id: { in: roleIds } } });
    if (existing.length !== roleIds.length) {
      throw new BadRequestException("One or more roles in the matrix were not found.");
    }
    await this.prisma.$transaction(
      roleIds.flatMap((roleId) => [
        this.prisma.rolePermission.deleteMany({ where: { roleId } }),
        this.prisma.rolePermission.createMany({
          data: matrix[roleId].map((key) => ({ roleId, permissionKey: key })),
        }),
      ]),
    );
    return this.list();
  }
}
