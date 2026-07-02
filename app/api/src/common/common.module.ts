import { Global, Module } from "@nestjs/common";
import { EncryptionService } from "./encryption.service";
import { AiClientService } from "./ai-client.service";

@Global()
@Module({
  providers: [EncryptionService, AiClientService],
  exports: [EncryptionService, AiClientService],
})
export class CommonModule {}
