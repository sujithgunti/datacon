import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConnectorEngineId } from "@datacon/shared-types";
import { api } from "./client";
import type { CatalogEntry, Connector, TablePreview } from "../lib/types";

export function useConnectors() {
  return useQuery({
    queryKey: ["connectors"],
    queryFn: async () => (await api.get<Connector[]>("/connectors")).data,
    refetchInterval: (query) => (query.state.data?.some((c) => c.status === "SYNCING") ? 1500 : false),
  });
}

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: async () => (await api.get<CatalogEntry[]>("/catalog")).data,
  });
}

export function useTablePreview(id: string | null) {
  return useQuery({
    queryKey: ["catalog", id],
    queryFn: async () => (await api.get<TablePreview>(`/catalog/${id}`)).data,
    enabled: !!id,
  });
}

export interface DraftConnector {
  name?: string;
  engine: ConnectorEngineId;
  fields: Record<string, string>;
  syncInterval?: string;
}

export function useTestDraftConnector() {
  return useMutation({
    mutationFn: async (dto: DraftConnector) => (await api.post<{ ok: boolean; message: string }>("/connectors/test-draft", dto)).data,
  });
}

function useInvalidateConnectors() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["connectors"] });
    qc.invalidateQueries({ queryKey: ["catalog"] });
  };
}

export function useCreateConnector() {
  const invalidate = useInvalidateConnectors();
  return useMutation({
    mutationFn: async (dto: DraftConnector) => (await api.post<Connector>("/connectors", dto)).data,
    onSuccess: invalidate,
  });
}

export function useSyncConnector() {
  const invalidate = useInvalidateConnectors();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Connector>(`/connectors/${id}/sync`)).data,
    onSuccess: invalidate,
  });
}

export function useDeleteConnector() {
  const invalidate = useInvalidateConnectors();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/connectors/${id}`)).data,
    onSuccess: invalidate,
  });
}
