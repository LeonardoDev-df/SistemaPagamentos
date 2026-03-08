import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, CreditCard, ToggleLeft, ToggleRight, Eye } from "lucide-react";
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
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const targetRole = isAdmin ? UserRole.COMPRADOR : UserRole.VENDEDOR;
  const pageTitle = isAdmin ? "Compradores" : "Vendedores";
  const buttonLabel = isAdmin ? "Novo Comprador" : "Novo Vendedor";

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
    data.role = targetRole;
    if (data.address && Object.values(data.address).every((v) => !v?.trim())) {
      data.address = undefined;
    }
    await createUser.mutateAsync(data);
    setCreateModal(false);
    reset({ role: targetRole });
  };

  const handleUpdate = async (data: UpdateUserRequest) => {
    if (!editingUser) return;
    if (data.address && Object.values(data.address).every((v) => !v?.trim())) {
      data.address = undefined;
    }
    await updateUser.mutateAsync({ uid: editingUser.uid, data });
    setEditingUser(null);
  };

  const handleToggleActive = async (u: User) => {
    await updateUser.mutateAsync({ uid: u.uid, data: { active: !u.active } });
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    await deleteUser.mutateAsync(uid);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-sm text-gray-500">
              {isAdmin ? "Gerencie os compradores do sistema" : "Gerencie seus vendedores e cartões"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => { reset({ role: targetRole }); setCreateModal(true); }}
        >
          <Plus className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{(users ?? []).length}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-success-600">{(users ?? []).filter(u => u.active).length}</p>
          <p className="text-sm text-gray-500">Ativos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 hidden sm:block">
          <p className="text-2xl font-bold text-danger-600">{(users ?? []).filter(u => !u.active).length}</p>
          <p className="text-sm text-gray-500">Inativos</p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Nome</th>
              <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Email</th>
              <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Telefone</th>
              <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(users ?? []).map((u) => (
              <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      u.active
                        ? "bg-accent-100 text-accent-700"
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{u.displayName}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                <td className="px-5 py-3.5 text-gray-600">{u.phone || "-"}</td>
                <td className="px-5 py-3.5 text-center">
                  <button
                    onClick={() => handleToggleActive(u)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      u.active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {u.active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                    {u.active ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1">
                    {!isAdmin && (
                      <button
                        onClick={() => navigate(`/usuarios/${u.uid}`)}
                        className="p-2 rounded-lg hover:bg-accent-50 text-accent-600 transition-colors"
                        title="Ver cartões"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingUser(u)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.uid)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                  Nenhum {isAdmin ? "comprador" : "vendedor"} cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {(users ?? []).length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            Nenhum {isAdmin ? "comprador" : "vendedor"} cadastrado ainda.
          </div>
        )}
        {(users ?? []).map((u) => (
          <div
            key={u.uid}
            className={`bg-white rounded-xl border shadow-sm p-4 space-y-3 ${
              u.active ? "border-gray-200" : "border-red-200 bg-red-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  u.active ? "bg-accent-100 text-accent-700" : "bg-gray-100 text-gray-400"
                }`}>
                  {u.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{u.displayName}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleActive(u)}
                className={`p-1.5 rounded-lg transition-colors ${
                  u.active
                    ? "text-green-600 hover:bg-green-50"
                    : "text-red-500 hover:bg-red-50"
                }`}
              >
                {u.active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
            {u.phone && <p className="text-sm text-gray-500">Tel: {u.phone}</p>}
            {u.pixKey && <p className="text-sm text-gray-500">PIX: {u.pixKey}</p>}
            <div className="flex gap-2 pt-1 border-t border-gray-100">
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
          <Input label="Nome" {...register("displayName")} error={errors.displayName?.message} />
          <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
          <Input label="Senha" type="password" {...register("password")} error={errors.password?.message} />
          <Input label="Telefone" placeholder="(00) 00000-0000" {...register("phone")} />
          <Input label="Chave PIX" placeholder="CPF, email, telefone ou chave aleatória" {...register("pixKey")} />
          <Input label="CPF" placeholder="000.000.000-00" {...register("cpf")} />

          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-sm font-medium text-gray-700 mb-3">Endereço (opcional)</p>
            <div className="space-y-3">
              <Input label="Rua" placeholder="Ex: Rua das Flores, 123" {...register("address.rua")} />
              <Input label="Bairro" placeholder="Ex: Centro" {...register("address.bairro")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Cidade" placeholder="Ex: São Paulo" {...register("address.cidade")} />
                <Input label="Estado" placeholder="SP" maxLength={2} {...register("address.estado")} />
              </div>
              <Input label="CEP" placeholder="00000-000" {...register("address.cep")} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button type="submit" loading={createUser.isPending}>Criar</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title={`Editar ${isAdmin ? "Comprador" : "Vendedor"}`}>
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
      cpf: user.cpf,
      address: user.address,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome" {...register("displayName")} />
      <Input label="Telefone" placeholder="(00) 00000-0000" {...register("phone")} />
      <Input label="Chave PIX" placeholder="CPF, email, telefone ou chave aleatória" {...register("pixKey")} />
      <Input label="CPF" placeholder="000.000.000-00" {...register("cpf")} />

      <div className="border-t border-gray-100 pt-4 mt-2">
        <p className="text-sm font-medium text-gray-700 mb-3">Endereço</p>
        <div className="space-y-3">
          <Input label="Rua" placeholder="Ex: Rua das Flores, 123" {...register("address.rua")} />
          <Input label="Bairro" placeholder="Ex: Centro" {...register("address.bairro")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cidade" placeholder="Ex: São Paulo" {...register("address.cidade")} />
            <Input label="Estado" placeholder="SP" maxLength={2} {...register("address.estado")} />
          </div>
          <Input label="CEP" placeholder="00000-000" {...register("address.cep")} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  );
}
