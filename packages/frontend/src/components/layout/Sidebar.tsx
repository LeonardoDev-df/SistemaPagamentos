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
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@sistema-pagamentos/shared";
import { ROUTES } from "@/config/routes";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
    isActive
      ? "bg-accent-500/15 text-accent-400 shadow-md shadow-accent-500/10 border border-accent-500/20"
      : "text-gray-400 hover:bg-white/5 hover:text-white"
  }`;

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const role = user?.role;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-primary-900 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 shadow-lg shadow-accent-500/30">
              <CreditCard className="h-5 w-5 text-primary-900" />
            </div>
            <div>
              <span className="font-bold text-white text-lg">SisPag</span>
              <p className="text-[10px] text-gray-500 -mt-0.5">Controle de Pagamentos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User card */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-400 font-semibold text-sm shrink-0">
              {user?.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Menu</p>

          <NavLink to={ROUTES.DASHBOARD} end className={navItemClass} onClick={onClose}>
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            Dashboard
          </NavLink>

          <NavLink to={ROUTES.TRANSACTIONS} className={navItemClass} onClick={onClose}>
            <ArrowLeftRight className="h-5 w-5 shrink-0" />
            Transações
          </NavLink>

          {/* Admin: manage Compradores */}
          {role === UserRole.ADMIN && (
            <>
              <p className="px-3 mt-5 mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Administração</p>
              <NavLink to={ROUTES.USERS} className={navItemClass} onClick={onClose}>
                <Users className="h-5 w-5 shrink-0" />
                Compradores
              </NavLink>
              <NavLink to={ROUTES.SETTINGS} className={navItemClass} onClick={onClose}>
                <Settings className="h-5 w-5 shrink-0" />
                Configurações
              </NavLink>
            </>
          )}

          {/* Comprador: manage Vendedores + Reports */}
          {role === UserRole.COMPRADOR && (
            <>
              <p className="px-3 mt-5 mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Gerenciamento</p>
              <NavLink to={ROUTES.USERS} className={navItemClass} onClick={onClose}>
                <Users className="h-5 w-5 shrink-0" />
                Vendedores
              </NavLink>
              <NavLink to={ROUTES.REPORTS} className={navItemClass} onClick={onClose}>
                <BarChart3 className="h-5 w-5 shrink-0" />
                Relatórios
              </NavLink>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-3 py-3 space-y-1">
          <NavLink to={ROUTES.PROFILE} className={navItemClass} onClick={onClose}>
            <UserCircle className="h-5 w-5 shrink-0" />
            Meu Perfil
          </NavLink>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
