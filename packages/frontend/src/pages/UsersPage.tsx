import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Plus, Edit2, Trash2, CreditCard, ToggleLeft, ToggleRight, Eye, Search, AlertTriangle, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import { useVendedores, useCreateVendedor, useUpdateVendedor, useDeleteVendedor } from "@/hooks/useVendedores";
import { useCards } from "@/hooks/useCards";
import {
  CreateUserRequest,
  UpdateUserRequest,
  CreateVendedorRequest,
  UpdateVendedorRequest,
  UserRole,
  User,
  Vendedor,
  Card,
} from "@sistema-pagamentos/shared";

// Mask helpers
function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function onlyLetters(v: string) {
  return v.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
}

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
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [createModal, setCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateUserRequest>({
    defaultValues: { role: UserRole.COMPRADOR },
  });

  const filtered = useMemo(() => {
    let list = users ?? [];
    if (statusFilter === "active") list = list.filter(u => u.active);
    if (statusFilter === "inactive") list = list.filter(u => !u.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return list;
  }, [users, statusFilter, search]);

  const onCreateSubmit = async (data: CreateUserRequest) => {
    data.role = UserRole.COMPRADOR;
    await createUser.mutateAsync(data);
    setCreateModal(false);
    reset({ role: UserRole.COMPRADOR });
  };

  const handleUpdate = async (data: UpdateUserRequest) => {
    if (!editingUser) return;
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compradores</h1>
            <p className="text-sm text-gray-500">{(users ?? []).length} cadastrados</p>
          </div>
        </div>
        <Button onClick={() => { reset({ role: UserRole.COMPRADOR }); setCreateModal(true); }}>
          <Plus className="h-4 w-4" /> Novo Comprador
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          className="text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none">
          <option value="all">Todos ({(users ?? []).length})</option>
          <option value="active">Ativos ({(users ?? []).filter(u => u.active).length})</option>
          <option value="inactive">Inativos ({(users ?? []).filter(u => !u.active).length})</option>
        </select>
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
            {filtered.map((u) => (
              <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${u.active ? "bg-accent-100 text-accent-700" : "bg-gray-100 text-gray-400"}`}>
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{u.displayName}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                <td className="px-5 py-3.5 text-gray-600">{u.phone || "-"}</td>
                <td className="px-5 py-3.5 text-center">
                  <button onClick={() => handleToggleActive(u)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${u.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
                    {u.active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                    {u.active ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditingUser(u)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Editar"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(u.uid)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Remover"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">{search ? "Nenhum resultado encontrado." : "Nenhum comprador cadastrado ainda."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">{search ? "Nenhum resultado." : "Nenhum comprador cadastrado."}</div>
        )}
        {filtered.map((u) => (
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

      {/* Create Comprador Modal - ONLY name, email, phone */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Novo Comprador">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <Input label="Nome *" {...register("displayName", { required: "Nome é obrigatório" })} error={errors.displayName?.message} />
          <Input label="Email Gmail *" type="email" placeholder="email@gmail.com" {...register("email", { required: "Email é obrigatório" })} error={errors.email?.message} />
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700">O comprador usará este Gmail para entrar no sistema via Google.</p>
          </div>
          <Input
            label="Telefone"
            placeholder="(00) 00000-0000"
            {...register("phone")}
            onChange={(e) => {
              const masked = maskPhone(e.target.value);
              e.target.value = masked;
              setValue("phone", masked);
            }}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button type="submit" loading={createUser.isPending}>Criar</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Comprador Modal */}
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
  const { data: allCards } = useCards();
  const createVendedor = useCreateVendedor();
  const updateVendedor = useUpdateVendedor();
  const deleteVendedor = useDeleteVendedor();

  const [createModal, setCreateModal] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");

  const vencimentos = useMemo(() => {
    if (!allCards) return [];
    const today = new Date();
    const dia = today.getDate();
    const alerts: { card: Card; vendedorName: string; diasRestantes: number }[] = [];
    for (const card of allCards) {
      if (!card.active || !card.diaVencimento) continue;
      const vendedor = (vendedores ?? []).find(v => v.id === card.vendedorId);
      if (!vendedor) continue;
      let diasRestantes: number;
      if (card.diaVencimento >= dia) {
        diasRestantes = card.diaVencimento - dia;
      } else {
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        diasRestantes = (daysInMonth - dia) + card.diaVencimento;
      }
      if (diasRestantes <= 5) {
        alerts.push({ card, vendedorName: vendedor.nome, diasRestantes });
      }
    }
    return alerts.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [allCards, vendedores]);

  const filtered = useMemo(() => {
    let list = vendedores ?? [];
    if (statusFilter === "active") list = list.filter(v => v.active);
    if (statusFilter === "inactive") list = list.filter(v => !v.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v => v.nome.toLowerCase().includes(q) || (v.empresa ?? "").toLowerCase().includes(q) || (v.funcao ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [vendedores, statusFilter, search]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateVendedorRequest>();

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendedores</h1>
            <p className="text-sm text-gray-500">{(vendedores ?? []).length} cadastrados</p>
          </div>
        </div>
        <Button onClick={() => { reset(); setCreateModal(true); }}>
          <Plus className="h-4 w-4" /> Novo Vendedor
        </Button>
      </div>

      {/* Due date notifications */}
      {vencimentos.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <Bell className="h-4 w-4" /> Vencimentos Próximos
          </div>
          <div className="space-y-1.5">
            {vencimentos.map((v, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-3.5 w-3.5 ${v.diasRestantes === 0 ? "text-red-500" : "text-amber-500"}`} />
                  <span className="text-gray-700">
                    <span className="font-medium">{v.vendedorName}</span> — {v.card.cardBrand} {v.card.cardType}
                    {v.card.valorMensal ? ` (R$ ${v.card.valorMensal.toFixed(2)})` : ""}
                  </span>
                </div>
                <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${v.diasRestantes === 0 ? "bg-red-100 text-red-700" : v.diasRestantes <= 2 ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}>
                  {v.diasRestantes === 0 ? "Vence hoje!" : `${v.diasRestantes} dia${v.diasRestantes > 1 ? "s" : ""}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nome, empresa, função..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          className="text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none">
          <option value="all">Todos ({(vendedores ?? []).length})</option>
          <option value="active">Ativos ({(vendedores ?? []).filter(v => v.active).length})</option>
          <option value="inactive">Inativos ({(vendedores ?? []).filter(v => !v.active).length})</option>
        </select>
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
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${v.active ? "bg-accent-100 text-accent-700" : "bg-gray-100 text-gray-400"}`}>
                      {v.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{v.nome}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{v.empresa || "-"}</td>
                <td className="px-5 py-3.5 text-gray-600">{v.funcao || "-"}</td>
                <td className="px-5 py-3.5 text-gray-600">{v.phone || "-"}</td>
                <td className="px-5 py-3.5 text-center">
                  <button onClick={() => handleToggleActive(v)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${v.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
                    {v.active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                    {v.active ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => navigate(`/vendedores/${v.id}`)} className="p-2 rounded-lg hover:bg-accent-50 text-accent-600 transition-colors" title="Ver cartões"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => setEditingVendedor(v)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Editar"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(v.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Remover"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">{search ? "Nenhum resultado encontrado." : "Nenhum vendedor cadastrado ainda."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">{search ? "Nenhum resultado." : "Nenhum vendedor cadastrado."}</div>
        )}
        {filtered.map((v) => (
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
              <Button size="sm" variant="secondary" onClick={() => navigate(`/vendedores/${v.id}`)}><CreditCard className="h-3.5 w-3.5" /> Cartões</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditingVendedor(v)}><Edit2 className="h-3.5 w-3.5" /> Editar</Button>
              <Button size="sm" variant="secondary" onClick={() => handleDelete(v.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /> Remover</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Vendedor Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Novo Vendedor">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <Input label="Nome *" {...register("nome", { required: "Nome é obrigatório" })} error={errors.nome?.message} />
          <Input label="Função" placeholder="Ex: Motorista, Cozinheiro..." {...register("funcao")} />
          <Input label="Empresa" placeholder="Ex: Empresa XYZ" {...register("empresa")} />
          <Input label="Telefone" placeholder="(00) 00000-0000" {...register("phone")}
            onChange={(e) => { const m = maskPhone(e.target.value); e.target.value = m; setValue("phone", m); }} />
          <Input label="Chave PIX" placeholder="CPF, email, telefone ou chave aleatória" {...register("pixKey")} />
          <Input label="CPF" placeholder="000.000.000-00" {...register("cpf")}
            onChange={(e) => { const m = maskCPF(e.target.value); e.target.value = m; setValue("cpf", m); }} />
          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-sm font-medium text-gray-700 mb-3">Endereço (opcional)</p>
            <div className="space-y-3">
              <Input label="Rua" {...register("address.rua")} />
              <Input label="Bairro" {...register("address.bairro")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Cidade" {...register("address.cidade")} />
                <Input label="Estado" placeholder="SP" maxLength={2} {...register("address.estado")}
                  onChange={(e) => { const m = onlyLetters(e.target.value).toUpperCase().slice(0, 2); e.target.value = m; setValue("address.estado", m); }} />
              </div>
              <Input label="CEP" placeholder="00000-000" {...register("address.cep")}
                onChange={(e) => { const m = maskCEP(e.target.value); e.target.value = m; setValue("address.cep", m); }} />
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
          <EditVendedorForm vendedor={editingVendedor} onSubmit={handleUpdate} onCancel={() => setEditingVendedor(null)} loading={updateVendedor.isPending} />
        )}
      </Modal>
    </div>
  );
}

// ============ Edit Forms ============
function EditUserForm({ user, onSubmit, onCancel, loading }: { user: User; onSubmit: (data: UpdateUserRequest) => void; onCancel: () => void; loading: boolean }) {
  const { register, handleSubmit, setValue } = useForm<UpdateUserRequest>({
    defaultValues: { displayName: user.displayName, phone: user.phone },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome" {...register("displayName")} />
      <Input label="Telefone" placeholder="(00) 00000-0000" {...register("phone")}
        onChange={(e) => { const m = maskPhone(e.target.value); e.target.value = m; setValue("phone", m); }} />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  );
}

function EditVendedorForm({ vendedor, onSubmit, onCancel, loading }: { vendedor: Vendedor; onSubmit: (data: UpdateVendedorRequest) => void; onCancel: () => void; loading: boolean }) {
  const { register, handleSubmit, setValue } = useForm<UpdateVendedorRequest>({
    defaultValues: {
      nome: vendedor.nome, funcao: vendedor.funcao, empresa: vendedor.empresa,
      phone: vendedor.phone, pixKey: vendedor.pixKey, cpf: vendedor.cpf, address: vendedor.address,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome" {...register("nome")} />
      <Input label="Função" {...register("funcao")} />
      <Input label="Empresa" {...register("empresa")} />
      <Input label="Telefone" placeholder="(00) 00000-0000" {...register("phone")}
        onChange={(e) => { const m = maskPhone(e.target.value); e.target.value = m; setValue("phone", m); }} />
      <Input label="Chave PIX" {...register("pixKey")} />
      <Input label="CPF" placeholder="000.000.000-00" {...register("cpf")}
        onChange={(e) => { const m = maskCPF(e.target.value); e.target.value = m; setValue("cpf", m); }} />
      <div className="border-t border-gray-100 pt-4 mt-2">
        <p className="text-sm font-medium text-gray-700 mb-3">Endereço</p>
        <div className="space-y-3">
          <Input label="Rua" {...register("address.rua")} />
          <Input label="Bairro" {...register("address.bairro")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cidade" {...register("address.cidade")} />
            <Input label="Estado" placeholder="SP" maxLength={2} {...register("address.estado")}
              onChange={(e) => { const m = onlyLetters(e.target.value).toUpperCase().slice(0, 2); e.target.value = m; setValue("address.estado", m); }} />
          </div>
          <Input label="CEP" placeholder="00000-000" {...register("address.cep")}
            onChange={(e) => { const m = maskCEP(e.target.value); e.target.value = m; setValue("address.cep", m); }} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  );
}
