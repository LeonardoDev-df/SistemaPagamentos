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
import { useVendedores, useCreateVendedor, useUpdateVendedor, useDeleteVendedor } from "@/hooks/useVendedores";
import {
  CreateUserRequest,
  UpdateUserRequest,
  CreateVendedorRequest,
  UpdateVendedorRequest,
  UserRole,
  User,
  Vendedor,
  createUserSchema,
  createVendedorSchema,
} from "@sistema-pagamentos/shared";

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  if (isAdmin) {
    return <AdminCompradoresView />;
  }
  return <CompradorVendedoresView />;
}

// ============ ADMIN VIEW: Manage Compradores ============
function AdminCompradoresView() {
  const navigate = useNavigate();
  const { data: users, isLoading } = useUsers(UserRole.COMPRADOR);
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
    defaultValues: { role: UserRole.COMPRADOR },
  });

  const onCreateSubmit = async (data: CreateUserRequest) => {
    data.role = UserRole.COMPRADOR;
    if (data.address && Object.values(data.address).every((v) => !v?.trim())) {
      data.address = undefined;
    }
    await createUser.mutateAsync(data);
    setCreateModal(false);
    reset({ role: UserRole.COMPRADOR });
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
    if (!confirm("Tem certeza que deseja remover este comprador?")) return;
    await deleteUser.mutateAsync(uid);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compradores</h1>
            <p className="text-sm text-gray-500">Gerencie os compradores do sistema</p>
          </div>
        </div>
        <Button onClick={() => { reset({ role: UserRole.COMPRADOR }); setCreateModal(true); }}>
          <Plus className="h-4 w-4" /> Novo Comprador
        </Button>
      </div>

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
                      u.active ? "bg-accent-100 text-accent-700" : "bg-gray-100 text-gray-400"
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
                      u.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {u.active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                    {u.active ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditingUser(u)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Editar">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(u.uid)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(users ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">Nenhum comprador cadastrado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {(users ?? []).length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Nenhum comprador cadastrado ainda.</div>
        )}
        {(users ?? []).map((u) => (
          <div key={u.uid} className={`bg-white rounded-xl border shadow-sm p-4 space-y-3 ${u.active ? "border-gray-200" : "border-red-200 bg-red-50/30"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${u.active ? "bg-accent-100 text-accent-700" : "bg-gray-100 text-gray-400"}`}>
                  {u.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{u.displayName}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
              </div>
              <button onClick={() => handleToggleActive(u)} className={`p-1.5 rounded-lg transition-colors ${u.active ? "text-green-600 hover:bg-green-50" : "text-red-500 hover:bg-red-50"}`}>
                {u.active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
            {u.phone && <p className="text-sm text-gray-500">Tel: {u.phone}</p>}
            <div className="flex gap-2 pt-1 border-t border-gray-100">
              <Button size="sm" variant="secondary" onClick={() => setEditingUser(u)}><Edit2 className="h-3.5 w-3.5" /> Editar</Button>
              <Button size="sm" variant="secondary" onClick={() => handleDelete(u.uid)}><Trash2 className="h-3.5 w-3.5 text-red-500" /> Remover</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Novo Comprador">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <Input label="Nome" {...register("displayName")} error={errors.displayName?.message} />
          <Input label="Email Gmail" type="email" placeholder="email@gmail.com" {...register("email")} error={errors.email?.message} />
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700">O comprador usará este Gmail para entrar no sistema via Google.</p>
          </div>
          <Input label="Telefone" placeholder="(00) 00000-0000" {...register("phone")} />
          <Input label="Chave PIX" {...register("pixKey")} />
          <Input label="CPF" placeholder="000.000.000-00" {...register("cpf")} />
          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-sm font-medium text-gray-700 mb-3">Endereço (opcional)</p>
            <div className="space-y-3">
              <Input label="Rua" {...register("address.rua")} />
              <Input label="Bairro" {...register("address.bairro")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Cidade" {...register("address.cidade")} />
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
      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Editar Comprador">
        {editingUser && (
          <EditUserForm user={editingUser} onSubmit={handleUpdate} onCancel={() => setEditingUser(null)} loading={updateUser.isPending} />
        )}
      </Modal>
    </div>
  );
}

// ============ COMPRADOR VIEW: Manage Vendedores ============
function CompradorVendedoresView() {
  const navigate = useNavigate();
  const { data: vendedores, isLoading } = useVendedores();
  const createVendedor = useCreateVendedor();
  const updateVendedor = useUpdateVendedor();
  const deleteVendedor = useDeleteVendedor();

  const [createModal, setCreateModal] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateVendedorRequest>({
    resolver: zodResolver(createVendedorSchema),
  });

  const onCreateSubmit = async (data: CreateVendedorRequest) => {
    if (data.address && Object.values(data.address).every((v) => !v?.trim())) {
      data.address = undefined;
    }
    await createVendedor.mutateAsync(data);
    setCreateModal(false);
    reset();
  };

  const handleUpdate = async (data: UpdateVendedorRequest) => {
    if (!editingVendedor) return;
    if (data.address && Object.values(data.address).every((v) => !v?.trim())) {
      data.address = undefined;
    }
    await updateVendedor.mutateAsync({ id: editingVendedor.id, data });
    setEditingVendedor(null);
  };

  const handleToggleActive = async (v: Vendedor) => {
    await updateVendedor.mutateAsync({ id: v.id, data: { active: !v.active } });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este vendedor?")) return;
    await deleteVendedor.mutateAsync(id);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendedores</h1>
            <p className="text-sm text-gray-500">Gerencie seus vendedores e cartões</p>
          </div>
        </div>
        <Button onClick={() => { reset(); setCreateModal(true); }}>
          <Plus className="h-4 w-4" /> Novo Vendedor
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{(vendedores ?? []).length}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-success-600">{(vendedores ?? []).filter(v => v.active).length}</p>
          <p className="text-sm text-gray-500">Ativos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 hidden sm:block">
          <p className="text-2xl font-bold text-danger-600">{(vendedores ?? []).filter(v => !v.active).length}</p>
          <p className="text-sm text-gray-500">Inativos</p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Nome</th>
              <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Empresa</th>
              <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Função</th>
              <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Telefone</th>
              <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(vendedores ?? []).map((v) => (
              <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      v.active ? "bg-accent-100 text-accent-700" : "bg-gray-100 text-gray-400"
                    }`}>
                      {v.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{v.nome}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{v.empresa || "-"}</td>
                <td className="px-5 py-3.5 text-gray-600">{v.funcao || "-"}</td>
                <td className="px-5 py-3.5 text-gray-600">{v.phone || "-"}</td>
                <td className="px-5 py-3.5 text-center">
                  <button
                    onClick={() => handleToggleActive(v)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      v.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {v.active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                    {v.active ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => navigate(`/vendedores/${v.id}`)} className="p-2 rounded-lg hover:bg-accent-50 text-accent-600 transition-colors" title="Ver cartões">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingVendedor(v)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Editar">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(vendedores ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Nenhum vendedor cadastrado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {(vendedores ?? []).length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Nenhum vendedor cadastrado ainda.</div>
        )}
        {(vendedores ?? []).map((v) => (
          <div key={v.id} className={`bg-white rounded-xl border shadow-sm p-4 space-y-3 ${v.active ? "border-gray-200" : "border-red-200 bg-red-50/30"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${v.active ? "bg-accent-100 text-accent-700" : "bg-gray-100 text-gray-400"}`}>
                  {v.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{v.nome}</p>
                  {v.empresa && <p className="text-sm text-gray-500">{v.empresa}</p>}
                </div>
              </div>
              <button onClick={() => handleToggleActive(v)} className={`p-1.5 rounded-lg transition-colors ${v.active ? "text-green-600 hover:bg-green-50" : "text-red-500 hover:bg-red-50"}`}>
                {v.active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
            {v.funcao && <p className="text-sm text-gray-500">Função: {v.funcao}</p>}
            {v.phone && <p className="text-sm text-gray-500">Tel: {v.phone}</p>}
            {v.pixKey && <p className="text-sm text-gray-500">PIX: {v.pixKey}</p>}
            <div className="flex gap-2 pt-1 border-t border-gray-100">
              <Button size="sm" variant="secondary" onClick={() => navigate(`/vendedores/${v.id}`)}>
                <CreditCard className="h-3.5 w-3.5" /> Cartões
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditingVendedor(v)}>
                <Edit2 className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleDelete(v.id)}>
                <Trash2 className="h-3.5 w-3.5 text-red-500" /> Remover
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Vendedor Modal - NO email/password needed */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Novo Vendedor">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <Input label="Nome *" {...register("nome")} error={errors.nome?.message} />
          <Input label="Função" placeholder="Ex: Motorista, Cozinheiro..." {...register("funcao")} />
          <Input label="Empresa" placeholder="Ex: Empresa XYZ" {...register("empresa")} />
          <Input label="Telefone" placeholder="(00) 00000-0000" {...register("phone")} />
          <Input label="Chave PIX" placeholder="CPF, email, telefone ou chave aleatória" {...register("pixKey")} />
          <Input label="CPF" placeholder="000.000.000-00" {...register("cpf")} />
          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-sm font-medium text-gray-700 mb-3">Endereço (opcional)</p>
            <div className="space-y-3">
              <Input label="Rua" {...register("address.rua")} />
              <Input label="Bairro" {...register("address.bairro")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Cidade" {...register("address.cidade")} />
                <Input label="Estado" placeholder="SP" maxLength={2} {...register("address.estado")} />
              </div>
              <Input label="CEP" placeholder="00000-000" {...register("address.cep")} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button type="submit" loading={createVendedor.isPending}>Cadastrar</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Vendedor Modal */}
      <Modal open={!!editingVendedor} onClose={() => setEditingVendedor(null)} title="Editar Vendedor">
        {editingVendedor && (
          <EditVendedorForm
            vendedor={editingVendedor}
            onSubmit={handleUpdate}
            onCancel={() => setEditingVendedor(null)}
            loading={updateVendedor.isPending}
          />
        )}
      </Modal>
    </div>
  );
}

// ============ Edit Forms ============
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
      <Input label="Chave PIX" {...register("pixKey")} />
      <Input label="CPF" placeholder="000.000.000-00" {...register("cpf")} />
      <div className="border-t border-gray-100 pt-4 mt-2">
        <p className="text-sm font-medium text-gray-700 mb-3">Endereço</p>
        <div className="space-y-3">
          <Input label="Rua" {...register("address.rua")} />
          <Input label="Bairro" {...register("address.bairro")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cidade" {...register("address.cidade")} />
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

function EditVendedorForm({
  vendedor,
  onSubmit,
  onCancel,
  loading,
}: {
  vendedor: Vendedor;
  onSubmit: (data: UpdateVendedorRequest) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { register, handleSubmit } = useForm<UpdateVendedorRequest>({
    defaultValues: {
      nome: vendedor.nome,
      funcao: vendedor.funcao,
      empresa: vendedor.empresa,
      phone: vendedor.phone,
      pixKey: vendedor.pixKey,
      cpf: vendedor.cpf,
      address: vendedor.address,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome" {...register("nome")} />
      <Input label="Função" {...register("funcao")} />
      <Input label="Empresa" {...register("empresa")} />
      <Input label="Telefone" placeholder="(00) 00000-0000" {...register("phone")} />
      <Input label="Chave PIX" {...register("pixKey")} />
      <Input label="CPF" placeholder="000.000.000-00" {...register("cpf")} />
      <div className="border-t border-gray-100 pt-4 mt-2">
        <p className="text-sm font-medium text-gray-700 mb-3">Endereço</p>
        <div className="space-y-3">
          <Input label="Rua" {...register("address.rua")} />
          <Input label="Bairro" {...register("address.bairro")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cidade" {...register("address.cidade")} />
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
