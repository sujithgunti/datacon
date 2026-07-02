import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export interface InsightsData {
  kpis: {
    revenue: { value: string; deltaPct: number };
    churn: { value: string; deltaPp: number };
    tickets: { value: string; deltaPct: number };
    anomalies: { count: number; highCount: number; mediumCount: number };
  };
  forecast: { series: { label: string; value: number }[]; projected: string; ciLow: string; ciHigh: string } | null;
  attention: { id: string; title: string; desc: string; tone: "high" | "medium"; clickable: boolean; question?: string }[];
}

export function useInsights() {
  return useQuery({
    queryKey: ["insights"],
    queryFn: async () => (await api.get<InsightsData>("/insights")).data,
  });
}
