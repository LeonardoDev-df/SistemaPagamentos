import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
  User,
  createUserSchema,
} from "@sistema-pagamentos/shared";

const roleOptions = [
  { value: "ADMIN", label: "Administrador" },
  { value: "VENDEDOR", label: "Vendedor" },
  { value: "COMPRADOR", label: "Comprador" },
];

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [createModal, setCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserRequest>({
    resolver: zodResolver(createUserSchema),
  });

  const onCreateSubmit = async (data: CreateUserRequest) => {
    await createUser.mutateAsync(data);
    setCreateModal(false);
    reset();
  };

  const handleUpdate = async (data: UpdateUserRequest) => {
    if (!editingUser) return;
    await updateUser.mutateAsync({ uid: editingUser.uid, data });
    setEditingUser(null);
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    await deleteUser.mutateAsync(uid);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <Button
          size="sm"
          onClick={() => {
            reset();
            setCreateModal(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(users ?? []).map((u) => (
                <tr key={u.uid} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.displayName}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        u.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.uid)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Novo Usuário">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <Input
            label="Nome"
            {...register("displayName")}
            error={errors.displayName?.message}
          />
          <Input
            label="Email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Senha"
            type="password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Select
            label="Role"
            options={roleOptions}
            {...register("role")}
            error={errors.role?.message}
          />
          <Input label="Telefone" {...register("phone")} />
          <Input label="Chave PIX" {...register("pixKey")} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createUser.isPending}>
              Criar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Editar Usuário"
      >
        {editingUser && (
          <EditUserForm
            user={editingUser}
            onSubmit={handleUpdate}
            onCancel={() => setEditingUser(null)}
            loading={updateUser.isPending}
          />
        )}
      </Modal>
    </div>
  );
}

function EditUserForm({
  user,
  onSubmit,
  onCancel,
  loading,
}: {
  user: User;
  onSubmit: (data: UpdateUserRequest) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { register, handleSubmit } = useForm<UpdateUserRequest>({
    defaultValues: {
      displayName: user.displayName,
      role: user.role,
      phone: user.phone,
      pixKey: user.pixKey,
      active: user.active,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome" {...register("displayName")} />
      <Select
        label="Role"
        options={[
          { value: "ADMIN", label: "Administrador" },
          { value: "VENDEDOR", label: "Vendedor" },
          { value: "COMPRADOR", label: "Comprador" },
        ]}
        {...register("role")}
      />
      <Input label="Telefone" {...register("phone")} />
      <Input label="Chave PIX" {...register("pixKey")} />
      <div className="flex items-center gap-2">
        <input type="checkbox" id="active" {...register("active")} className="rounded" />
        <label htmlFor="active" className="text-sm text-gray-700">
          Ativo
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
