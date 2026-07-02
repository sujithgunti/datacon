import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PermissionKey } from "@datacon/shared-types";
import { api } from "./client";
import type { PermissionDef, RbacRole, RbacUser } from "../lib/types";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<RbacUser[]>("/users")).data,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await api.get<RbacRole[]>("/roles")).data,
  });
}

export function usePermissionCatalog() {
  return useQuery({
    queryKey: ["permission-catalog"],
    queryFn: async () => (await api.get<PermissionDef[]>("/permissions")).data,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["users"] });
    qc.invalidateQueries({ queryKey: ["roles"] });
    qc.invalidateQueries({ queryKey: ["me"] });
  };
}

export function useCreateUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (dto: { name: string; email: string; roleId: string }) => (await api.post<RbacUser>("/users", dto)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; name?: string; email?: string; roleId?: string }) => (await api.patch<RbacUser>(`/users/${id}`, dto)).data,
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/users/${id}`)).data,
    onSuccess: invalidate,
  });
}

export function useAssignRole() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, roleId }: { id: string; roleId: string }) => (await api.patch<RbacUser>(`/users/${id}/assign-role`, { roleId })).data,
    onSuccess: invalidate,
  });
}

export function useCreateRole() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (dto: { name: string; colorHex: string; permissions: PermissionKey[] }) => (await api.post<RbacRole>("/roles", dto)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateRole() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; name?: string; colorHex?: string; permissions?: PermissionKey[] }) =>
      (await api.patch<RbacRole>(`/roles/${id}`, dto)).data,
    onSuccess: invalidate,
  });
}

export function useDeleteRole() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/roles/${id}`)).data,
    onSuccess: invalidate,
  });
}

export function useApplyPermissionsMatrix() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (matrix: Record<string, PermissionKey[]>) => (await api.put<RbacRole[]>("/roles/permissions-matrix", { matrix })).data,
    onSuccess: invalidate,
  });
}
