import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ThemeProvider } from "./theme/ThemeContext";
import { ToastProvider } from "./components/ui/ToastContext";
import { ConfirmProvider } from "./components/ui/ConfirmContext";
import { AppShell } from "./components/shell/AppShell";
import { RequireAdmin } from "./components/shell/RequireAdmin";
import { AuthPage } from "./routes/auth/AuthPage";
import { UsersPage } from "./routes/settings/UsersPage";
import { RolesPage } from "./routes/settings/RolesPage";
import { AssignRolesPage } from "./routes/settings/AssignRolesPage";
import { PermissionsPage } from "./routes/settings/PermissionsPage";
import { ConnectorsPage } from "./routes/connectors/ConnectorsPage";
import { DataSourcesPage } from "./routes/data-sources/DataSourcesPage";
import { ChatPage } from "./routes/chat/ChatPage";
import { ForecastsPage } from "./routes/forecasts/ForecastsPage";
import { InsightsPage } from "./routes/insights/InsightsPage";
import { ThemesPage } from "./routes/themes/ThemesPage";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/connectors" element={<ConnectorsPage />} />
        <Route path="/data-sources" element={<DataSourcesPage />} />
        <Route path="/forecasts" element={<ForecastsPage />} />
        <Route path="/themes" element={<ThemesPage />} />
        <Route
          path="/settings/users"
          element={
            <RequireAdmin>
              <UsersPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/settings/roles"
          element={
            <RequireAdmin>
              <RolesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/settings/assign"
          element={
            <RequireAdmin>
              <AssignRolesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/settings/permissions"
          element={
            <RequireAdmin>
              <PermissionsPage />
            </RequireAdmin>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
