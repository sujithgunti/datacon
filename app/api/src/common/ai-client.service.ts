import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

@Injectable()
export class AiClientService {
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL: this.config.get<string>("AI_SERVICE_URL") ?? "http://localhost:8000",
      timeout: 30_000,
      headers: { "X-Internal-Auth": this.config.get<string>("INTERNAL_AUTH_TOKEN") ?? "" },
    });
  }

  get client() {
    return this.http;
  }
}
