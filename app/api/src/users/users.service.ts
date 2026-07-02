import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

const AVATAR_GRADIENTS = [
  "var(--ac-grad)",
  "linear-gradient(135deg,#ff8a5c,#ff5c7a)",
  "linear-gradient(135deg,#1fb6a6,#13a06b)",
  "linear-gradient(135deg,#5b8def,#3f6fd6)",
  "linear-gradient(135deg,#f2a65a,#e2603f)",
];

function initialsFor(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "U";
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private select() {
    return {
      id: true,
      name: true,
      email: true,
      initials: true,
      avatarGrad: true,
      title: true,
      isCore: true,
      createdAt: true,
      roleId: true,
      role: { select: { id: true, name: true, colorHex: true, bgHex: true, permissions: { select: { permissionKey: true } } } },
    } as const;
  }

  async list() {
    const users = await this.prisma.user.findMany({ select: this.select(), orderBy: { createdAt: "asc" } });
    return users.map((u) => ({
      ...u,
      canDelete: !u.isCore,
      permissionCount: u.role.permissions.length,
    }));
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("An account with this email already exists.");
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new BadRequestException("Unknown role.");

    const count = await this.prisma.user.count();
    const tempPassword = bcrypt.genSaltSync(10); // random-looking placeholder; real invite flow would email a reset link
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        title: dto.title,
        roleId: dto.roleId,
        passwordHash,
        initials: initialsFor(dto.name),
        avatarGrad: AVATAR_GRADIENTS[count % AVATAR_GRADIENTS.length],
        isCore: false,
      },
      select: this.select(),
    });
    return { ...user, canDelete: true, permissionCount: user.role.permissions.length };
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found.");
    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
      if (!role) throw new BadRequestException("Unknown role.");
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { name: dto.name, email: dto.email, roleId: dto.roleId, title: dto.title },
      select: this.select(),
    });
    return { ...updated, canDelete: !updated.isCore, permissionCount: updated.role.permissions.length };
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found.");
    if (user.isCore) {
      throw new ForbiddenException("This is a core demo account and can't be removed.");
    }
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  async assignRole(id: string, roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new BadRequestException("Unknown role.");
    const updated = await this.prisma.user.update({
      where: { id },
      data: { roleId },
      select: this.select(),
    });
    return { ...updated, canDelete: !updated.isCore, permissionCount: updated.role.permissions.length };
  }
}
