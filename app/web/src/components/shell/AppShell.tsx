import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ToastHost } from "../ui/ToastHost";

export function AppShell() {
  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflowY: "auto", background: "var(--ac-bg)" }}>
        <Outlet />
      </main>
      <ToastHost />
    </div>
  );
}
