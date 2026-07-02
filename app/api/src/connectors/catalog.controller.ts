import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ConnectorsService } from "./connectors.service";

@UseGuards(JwtAuthGuard)
@Controller("catalog")
export class CatalogController {
  constructor(private readonly connectors: ConnectorsService) {}

  @Get()
  list() {
    return this.connectors.catalog();
  }

  @Get(":id")
  preview(@Param("id") id: string) {
    return this.connectors.tablePreview(id);
  }
}
