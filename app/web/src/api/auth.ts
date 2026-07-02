import { useQuery } from "@tanstack/react-query";
import { api } from "./client";
import type { Persona } from "../lib/types";

export function usePersonas() {
  return useQuery({
    queryKey: ["personas"],
    queryFn: async () => {
      const res = await api.get<Persona[]>("/auth/personas");
      return res.data;
    },
    staleTime: 5 * 60_000,
  });
}
