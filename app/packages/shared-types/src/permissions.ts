export type PermissionKey =
  | "view_dashboards"
  | "ask_agents"
  | "export_data"
  | "upload_docs"
  | "manage_connectors"
  | "manage_users"
  | "manage_roles";

export interface PermissionDef {
  key: PermissionKey;
  label: string;
  group: "Analytics" | "Data" | "Administration";
}

export const PERMISSIONS: PermissionDef[] = [
  { key: "view_dashboards", label: "View dashboards & forecasts", group: "Analytics" },
  { key: "ask_agents", label: "Ask the AI agents", group: "Analytics" },
  { key: "export_data", label: "Export data & reports", group: "Analytics" },
  { key: "upload_docs", label: "Upload & index documents", group: "Data" },
  { key: "manage_connectors", label: "Manage data connectors", group: "Data" },
  { key: "manage_users", label: "Create & manage users", group: "Administration" },
  { key: "manage_roles", label: "Manage roles & permissions", group: "Administration" },
];

export interface Capabilities {
  manageConnectors: boolean;
  uploadDocs: boolean;
  manageUsers: boolean;
  manageRoles: boolean;
  exportData: boolean;
  admin: boolean;
}

export function capsFromPermissions(perms: string[]): Capabilities {
  const has = (k: PermissionKey) => perms.includes(k);
  return {
    manageConnectors: has("manage_connectors"),
    uploadDocs: has("upload_docs"),
    manageUsers: has("manage_users"),
    manageRoles: has("manage_roles"),
    exportData: has("export_data"),
    admin: has("manage_users") || has("manage_roles"),
  };
}
