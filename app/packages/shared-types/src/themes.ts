export interface ThemePreset {
  id: "soft" | "emerald" | "sapphire" | "sunset";
  name: string;
  description: string;
  ac: string;
  ac2: string;
  tint: string;
}

// Ported verbatim from project/Datacon.dc.html THEMES constant.
export const THEME_PRESETS: ThemePreset[] = [
  { id: "soft", name: "Soft Premium", description: "Signature indigo · violet", ac: "#6d4dff", ac2: "#7d5cff", tint: "#efeaff" },
  { id: "emerald", name: "Emerald Lux", description: "Deep green · jade", ac: "#0f9d6b", ac2: "#17b884", tint: "#e3f6ee" },
  { id: "sapphire", name: "Sapphire Blue", description: "Royal blue · cyan", ac: "#2f66f0", ac2: "#4d84ff", tint: "#e7eeff" },
  { id: "sunset", name: "Sunset Coral", description: "Warm coral · amber", ac: "#e2544f", ac2: "#f0725c", tint: "#fdeaec" },
];

export const DEFAULT_THEME_ID = "soft";
export const DEFAULT_CUSTOM_ACCENT = "#8b5cf6";
