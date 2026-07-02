import { Module } from "@nestjs/common";
import { ConnectorsService } from "./connectors.service";
import { ConnectorsController } from "./connectors.controller";
import { CatalogController } from "./catalog.controller";

@Module({
  providers: [ConnectorsService],
  controllers: [ConnectorsController, CatalogController],
})
export class ConnectorsModule {}
