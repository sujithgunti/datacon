import { Module } from "@nestjs/common";
import { ForecastsController } from "./forecasts.controller";

@Module({
  controllers: [ForecastsController],
})
export class ForecastsModule {}
