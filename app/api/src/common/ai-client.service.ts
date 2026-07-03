import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

@Injectable()
export class AiClientService {
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL: this.config.get<string>("AI_SERVICE_URL") ?? "http://localhost:8000",
      // Generous: on Render's free tier the ai service spins down after
      // ~15min idle and can take 50s+ to cold-start before it responds
      // to any of forecasts/connectors/chat's first request after that.
      timeout: 120_000,
      headers: { "X-Internal-Auth": this.config.get<string>("INTERNAL_AUTH_TOKEN") ?? "" },
    });
  }

  get client() {
    return this.http;
  }
}
