import { Routes, Route, Navigate } from "react-router-dom";
import { UserRole } from "@sistema-pagamentos/shared";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { NewTransactionPage } from "@/pages/NewTransactionPage";
import { TransactionDetailPage } from "@/pages/TransactionDetailPage";
import { UsersPage } from "@/pages/UsersPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { ProfilePage } from "@/pages/ProfilePage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />

        <Route path="/transacoes" element={<TransactionsPage />} />
        <Route
          path="/transacoes/nova"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.VENDEDOR]}>
              <NewTransactionPage />
            </ProtectedRoute>
          }
        />
        <Route path="/transacoes/:id" element={<TransactionDetailPage />} />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="/perfil" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
