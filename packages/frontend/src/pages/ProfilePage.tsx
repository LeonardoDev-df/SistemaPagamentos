import { useForm } from "react-hook-form";
import { UserCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { UpdateUserRequest } from "@sistema-pagamentos/shared";
import api from "@/config/api";
import toast from "react-hot-toast";
import { useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  COMPRADOR: "Comprador",
};

export function ProfilePage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit } = useForm<UpdateUserRequest>({
    values: user
      ? { displayName: user.displayName, phone: user.phone, pixKey: user.pixKey }
      : undefined,
  });

  const onSubmit = async (data: UpdateUserRequest) => {
    try {
      setSaving(true);
      await api.put("/api/auth/profile", data);
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <UserCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-sm text-gray-500">Gerencie suas informações</p>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 sm:p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold truncate">{user?.displayName}</p>
            <p className="text-primary-200 text-sm truncate">{user?.email}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white/20 text-white mt-1">
              {ROLE_LABELS[user?.role ?? ""] || user?.role}
            </span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4"
      >
        <Input label="Nome" {...register("displayName")} />
        <Input label="Telefone" placeholder="(00) 00000-0000" {...register("phone")} />
        <Input label="Chave PIX" placeholder="CPF, email, telefone ou chave aleatória" {...register("pixKey")} />
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={saving}>Salvar</Button>
        </div>
      </form>
    </div>
  );
}
