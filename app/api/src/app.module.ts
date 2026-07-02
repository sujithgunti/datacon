import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { CommonModule } from "./common/common.module";
import { HealthController } from "./health/health.controller";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RolesModule } from "./roles/roles.module";
import { PermissionsModule } from "./permissions/permissions.module";
import { ConnectorsModule } from "./connectors/connectors.module";
import { DocumentsModule } from "./documents/documents.module";
import { MetricsModule } from "./metrics/metrics.module";
import { ChatModule } from "./chat/chat.module";
import { ForecastsModule } from "./forecasts/forecasts.module";
import { InsightsModule } from "./insights/insights.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ConnectorsModule,
    DocumentsModule,
    MetricsModule,
    ChatModule,
    ForecastsModule,
    InsightsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
