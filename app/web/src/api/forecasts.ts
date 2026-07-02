import { useQuery } from "@tanstack/react-query";
import { api } from "./client";
import type { ForecastResult } from "../lib/types";

export function useForecast(model: string, horizon: number) {
  return useQuery({
    queryKey: ["forecast", model, horizon],
    queryFn: async () => (await api.get<ForecastResult>("/forecasts", { params: { model, horizon } })).data,
  });
}
