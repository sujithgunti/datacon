import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { usePersonas } from "../../api/auth";

interface NavDef {
  id: string;
  icon: string;
  label: string;
  to: string;
  divider?: boolean;
}

const NAV: NavDef[] = [
  { id: "chat", icon: "💬", label: "Chat", to: "/chat" },
  { id: "insights", icon: "📊", label: "Insights", to: "/insights" },
  { id: "connectors", icon: "🔌", label: "Connectors", to: "/connectors" },
  { id: "documents", icon: "🗄️", label: "Data Sources", to: "/data-sources" },
  { id: "forecasts", icon: "📈", label: "Forecasts", to: "/forecasts" },
  { id: "settings", icon: "⚙️", label: "User management", to: "/settings/users" },
  { id: "themes", icon: "🎨", label: "Themes", to: "/themes", divider: true },
];

const SUB_NAV = [
  { id: "users", icon: "👤", label: "Users", to: "/settings/users" },
  { id: "roles", icon: "🛡️", label: "Roles", to: "/settings/roles" },
  { id: "assign", icon: "🔗", label: "Assign roles", to: "/settings/assign" },
  { id: "permissions", icon: "🔑", label: "Permissions", to: "/settings/permissions" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { user, caps, quickLogin, logout } = useAuth();
  const { data: personas } = usePersonas();
  const location = useLocation();
  const navigate = useNavigate();

  const onUserMgmtPage = location.pathname.startsWith("/settings");

  return (
    <>
      <aside
        className={`dv-side${collapsed ? " dv-collapsed" : ""}`}
        style={{
          background: "#fff",
          borderRight: "1px solid #e9eaf2",
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, justifyContent: collapsed ? "center" : "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: collapsed ? 34 : 32,
                height: collapsed ? 34 : 32,
                borderRadius: 10,
                background: "var(--ac-logo)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              D
            </div>
            {!collapsed && <span style={{ fontWeight: 800, fontSize: 17 }}>Datacon</span>}
          </div>
          {!collapsed && (
            <button title="Collapse menu" onClick={() => setCollapsed(true)} style={{ color: "#9499ad" }}>
              «
            </button>
          )}
        </div>
        {collapsed && (
          <button title="Expand menu" onClick={() => setCollapsed(false)} style={{ color: "#9499ad", marginBottom: 12 }}>
            »
          </button>
        )}

        <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, overflowY: "auto" }}>
          {NAV.map((item) => {
            if (item.id === "settings" && !caps.admin) return null;
            return (
              <div key={item.id}>
                {item.divider && <div style={{ height: 1, background: "#e9eaf2", margin: "10px 4px" }} />}
                <NavLink
                  to={item.to}
                  title={item.label}
                  className="dv-navitem"
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 11px",
                    borderRadius: 10,
                    fontSize: 13.5,
                    textDecoration: "none",
                    background: isActive || (item.id === "settings" && onUserMgmtPage) ? "var(--ac-grad)" : "transparent",
                    color: isActive || (item.id === "settings" && onUserMgmtPage) ? "#fff" : "#71768a",
                    fontWeight: isActive || (item.id === "settings" && onUserMgmtPage) ? 700 : 500,
                  })}
                >
                  <span>{item.icon}</span>
                  {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>}
                  {collapsed && <span className="dv-tip">{item.label}</span>}
                </NavLink>
                {item.id === "settings" && caps.admin && onUserMgmtPage && (
                  <div className="dv-sub" style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 3, marginBottom: 3 }}>
                    {SUB_NAV.map((s) => (
                      <NavLink
                        key={s.id}
                        to={s.to}
                        title={s.label}
                        className="dv-navitem"
                        style={({ isActive }) => ({
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "7px 10px",
                          borderRadius: 9,
                          fontSize: 12.5,
                          textDecoration: "none",
                          background: isActive ? "var(--ac-soft)" : "transparent",
                          color: isActive ? "var(--ac-deep)" : "#71768a",
                          fontWeight: isActive ? 700 : 500,
                        })}
                      >
                        <span>{s.icon}</span>
                        {!collapsed && <span>{s.label}</span>}
                        {collapsed && <span className="dv-tip">{s.label}</span>}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f9" }}>
          {!collapsed && <div style={{ font: "600 9.5px 'IBM Plex Mono',monospace", letterSpacing: ".14em", color: "#a3a8bd", marginBottom: 8 }}>VIEWING AS</div>}
          {!collapsed && user && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f5f6fb", borderRadius: 11, padding: "8px 9px", marginBottom: 8 }}>
              <Avatar grad={user.avatarGrad} initials={user.initials} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                <div style={{ fontSize: 10.5, color: "#9499ad" }}>
                  {user.roleName} · {user.title}
                </div>
              </div>
            </div>
          )}
          {!collapsed && (
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {personas?.map((p) => (
                <button
                  key={p.id}
                  title={p.name}
                  onClick={() => quickLogin(p.id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    padding: "5px 2px",
                    borderRadius: 9,
                    border: `1px solid ${user?.id === p.id ? "var(--ac-ring)" : "transparent"}`,
                    background: user?.id === p.id ? "var(--ac-soft)" : "transparent",
                  }}
                >
                  <Avatar grad={p.avatarGrad} initials={p.initials} size={22} ring={user?.id === p.id} />
                  <span style={{ fontSize: 9.5, color: "#71768a" }}>{p.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, justifyContent: collapsed ? "center" : "stretch" }}>
            <button
              title="Profile"
              onClick={() => setShowProfile(true)}
              className="dv-navitem"
              style={{ flex: collapsed ? undefined : 1, padding: "7px 0", borderRadius: 9, fontSize: 12, color: "#71768a", background: "#f5f6fb" }}
            >
              👤{!collapsed && " Profile"}
              {collapsed && <span className="dv-tip">Profile</span>}
            </button>
            <button
              title="Sign out"
              onClick={() => logout()}
              className="dv-navitem"
              style={{ flex: collapsed ? undefined : 1, padding: "7px 0", borderRadius: 9, fontSize: 12, color: "#c0405a", background: "#f5f6fb" }}
            >
              ⎋{!collapsed && " Sign out"}
              {collapsed && <span className="dv-tip">Sign out</span>}
            </button>
          </div>
        </div>
      </aside>
      {showProfile && user && <ProfileModal onClose={() => setShowProfile(false)} onSignOut={() => { setShowProfile(false); logout(); navigate("/"); }} />}
    </>
  );
}

export function Avatar({ grad, initials, size, ring }: { grad: string; initials: string; size: number; ring?: boolean }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: grad,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
        boxShadow: ring ? "0 0 0 2px var(--ac)" : "none",
      }}
    >
      {initials}
    </div>
  );
}

function ProfileModal({ onClose, onSignOut }: { onClose: () => void; onSignOut: () => void }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,29,41,.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} className="dvfu" style={{ width: 440, maxWidth: "92vw", background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 70px -20px rgba(26,29,41,.5)" }}>
        <div style={{ height: 96, background: "linear-gradient(135deg,#221c46,#3a2f73 55%,var(--ac))", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.18)", color: "#fff" }}>
            ✕
          </button>
        </div>
        <div style={{ padding: "0 24px 24px", marginTop: -38 }}>
          <Avatar grad={user.avatarGrad} initials={user.initials} size={76} />
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 10 }}>{user.name}</div>
          <div style={{ fontSize: 13, color: "#71768a", marginBottom: 16 }}>{user.title}</div>
          <div style={{ border: "1px solid #e9eaf2", borderRadius: 12, overflow: "hidden" }}>
            <InfoRow icon="✉️" label="EMAIL" value={user.email} shaded />
            <InfoRow icon="🛡️" label="ROLE & ACCESS" value={`${user.roleName} · ${user.permissions.length} permissions`} />
            <InfoRow icon="🕑" label="LAST ACTIVE" value="Just now · This session" shaded />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #e2e4ee", fontWeight: 700, fontSize: 13 }}>
              Close
            </button>
            <button onClick={onSignOut} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #e8a9b4", color: "#c0405a", fontWeight: 700, fontSize: 13 }}>
              ⎋ Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, shaded }: { icon: string; label: string; value: string; shaded?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: shaded ? "#fafbfe" : "#fff" }}>
      <span>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ font: "600 9.5px 'IBM Plex Mono',monospace", letterSpacing: ".1em", color: "#a3a8bd" }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  );
}
