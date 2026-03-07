import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Settings,
  UserCircle,
  LogOut,
  CreditCard,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@sistema-pagamentos/shared";
import { ROUTES } from "@/config/routes";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-indigo-50 text-indigo-700"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  }`;

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const role = user?.role;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-gray-900">SisPag</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {(role === UserRole.ADMIN || role === UserRole.VENDEDOR) && (
            <NavLink to={ROUTES.DASHBOARD} end className={navItemClass} onClick={onClose}>
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </NavLink>
          )}

          {(role === UserRole.ADMIN || role === UserRole.VENDEDOR) && (
            <NavLink to={ROUTES.TRANSACTIONS} className={navItemClass} onClick={onClose}>
              <ArrowLeftRight className="h-5 w-5" />
              Transações
            </NavLink>
          )}

          {role === UserRole.COMPRADOR && (
            <NavLink to={ROUTES.TRANSACTIONS} className={navItemClass} onClick={onClose}>
              <ArrowLeftRight className="h-5 w-5" />
              Minhas Transações
            </NavLink>
          )}

          {role === UserRole.ADMIN && (
            <NavLink to={ROUTES.USERS} className={navItemClass} onClick={onClose}>
              <Users className="h-5 w-5" />
              Usuários
            </NavLink>
          )}

          {role === UserRole.ADMIN && (
            <NavLink to={ROUTES.SETTINGS} className={navItemClass} onClick={onClose}>
              <Settings className="h-5 w-5" />
              Configurações
            </NavLink>
          )}
        </nav>

        <div className="border-t border-gray-200 px-3 py-4 space-y-1">
          <NavLink to={ROUTES.PROFILE} className={navItemClass} onClick={onClose}>
            <UserCircle className="h-5 w-5" />
            Meu Perfil
          </NavLink>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
