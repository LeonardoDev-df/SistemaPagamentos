import { Menu, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onMenuClick: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  COMPRADOR: "Comprador",
};

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative">
          <Bell className="h-5 w-5 text-gray-400" />
        </button>

        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold text-gray-900">{user?.displayName}</p>
          <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role ?? ""] || user?.role}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-primary-500/20">
          {user?.displayName?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
