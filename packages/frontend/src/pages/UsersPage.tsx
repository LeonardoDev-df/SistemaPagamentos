import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
  User,
  createUserSchema,
} from "@sistema-pagamentos/shared";

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Admin sees compradores, Comprador sees vendedores
  const targetRole = isAdmin ? UserRole.COMPRADOR : UserRole.VENDEDOR;
  const pageTitle = isAdmin ? "Compradores" : "Vendedores";
  const buttonLabel = isAdmin ? "Novo Comprador" : "Novo Vendedor";

  const navigate = useNavigate();
  const { data: users, isLoading } = useUsers(targetRole);
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
    defaultValues: { role: targetRole },
  });

  const onCreateSubmit = async (data: CreateUserRequest) => {
    // Force the correct role
    data.role = targetRole;
    await createUser.mutateAsync(data);
    setCreateModal(false);
    reset({ role: targetRole });
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
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <Button
          size="sm"
          onClick={() => {
            reset({ role: targetRole });
            setCreateModal(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Telefone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(users ?? []).map((u) => (
                <tr key={u.uid} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.displayName}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone || "-"}</td>
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
                      {!isAdmin && (
                        <button
                          onClick={() => navigate(`/usuarios/${u.uid}`)}
                          className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600"
                          title="Cartões"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                      )}
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
              {(users ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nenhum {targetRole === UserRole.COMPRADOR ? "comprador" : "vendedor"} cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {(users ?? []).length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
            Nenhum {targetRole === UserRole.COMPRADOR ? "comprador" : "vendedor"} cadastrado.
          </div>
        )}
        {(users ?? []).map((u) => (
          <div key={u.uid} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{u.displayName}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {u.active ? "Ativo" : "Inativo"}
              </span>
            </div>
            {u.phone && <p className="text-sm text-gray-500">Tel: {u.phone}</p>}
            <div className="flex gap-2 pt-1">
              {!isAdmin && (
                <Button size="sm" variant="secondary" onClick={() => navigate(`/usuarios/${u.uid}`)}>
                  <CreditCard className="h-3.5 w-3.5" /> Cartões
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setEditingUser(u)}>
                <Edit2 className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleDelete(u.uid)}>
                <Trash2 className="h-3.5 w-3.5 text-red-500" /> Remover
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title={buttonLabel}>
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
          {/* Role is set automatically, no select needed */}
          <Input label="Telefone" placeholder="(00) 00000-0000" {...register("phone")} />
          <Input label="Chave PIX" placeholder="CPF, email, telefone ou chave aleatória" {...register("pixKey")} />
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
        title={`Editar ${targetRole === UserRole.COMPRADOR ? "Comprador" : "Vendedor"}`}
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
      phone: user.phone,
      pixKey: user.pixKey,
      active: user.active,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome" {...register("displayName")} />
      <Input label="Telefone" placeholder="(00) 00000-0000" {...register("phone")} />
      <Input label="Chave PIX" placeholder="CPF, email, telefone ou chave aleatória" {...register("pixKey")} />
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
