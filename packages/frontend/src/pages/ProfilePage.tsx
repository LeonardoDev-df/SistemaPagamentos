import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { UpdateUserRequest } from "@sistema-pagamentos/shared";
import api from "@/config/api";
import toast from "react-hot-toast";
import { useState } from "react";

export function ProfilePage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit } = useForm<UpdateUserRequest>({
    values: user
      ? {
          displayName: user.displayName,
          phone: user.phone,
          pixKey: user.pixKey,
        }
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
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
      >
        <Input label="Email" value={user?.email ?? ""} disabled />
        <Input
          label="Role"
          value={user?.role ?? ""}
          disabled
        />
        <Input label="Nome" {...register("displayName")} />
        <Input label="Telefone" {...register("phone")} />
        <Input label="Chave PIX" {...register("pixKey")} />

        <div className="flex justify-end pt-4">
          <Button type="submit" loading={saving}>
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}
