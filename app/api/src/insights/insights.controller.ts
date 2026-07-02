import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { InsightsService } from "./insights.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("insights")
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  @RequirePermissions("view_dashboards")
  @Get()
  get() {
    return this.insights.get();
  }
}
