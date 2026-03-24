import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Plus, CreditCard, Trash2, Phone, Key, FileText, MapPin, Building, Briefcase, ToggleRight, ToggleLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { useVendedor } from "@/hooks/useVendedores";
import { useCards, useCreateCard, useDeleteCard, useUpdateCard } from "@/hooks/useCards";
import { CreateCardRequest, Card, UpdateCardRequest } from "@sistema-pagamentos/shared";

const CARD_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  VR: { label: "Vale Refeição", color: "text-orange-600", bg: "bg-gradient-to-br from-orange-50 to-orange-100", border: "border-orange-200" },
  VA: { label: "Vale Alimentação", color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-50 to-emerald-100", border: "border-emerald-200" },
};

function maskCardNumber(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 16);
  return d.replace(/(.{4})/g, "$1 ").trim();
}

export function VendedorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vendedor, isLoading: loadingVendedor } = useVendedor(id!);
  const { data: cards, isLoading: loadingCards } = useCards(id);
  const createCard = useCreateCard();
  const deleteCard = useDeleteCard();
  const updateCard = useUpdateCard();

  const [cardModal, setCardModal] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Omit<CreateCardRequest, "vendedorId">>({
    defaultValues: { cardType: "VR" as const },
  });

  const onCreateCard = async (data: Omit<CreateCardRequest, "vendedorId">) => {
    await createCard.mutateAsync({ ...data, vendedorId: id! });
    setCardModal(false);
    reset({ cardType: "VR" as const });
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Remover este cartão?")) return;
    await deleteCard.mutateAsync(cardId);
  };

  const handleToggleCard = async (card: Card) => {
    await updateCard.mutateAsync({ id: card.id, data: { active: !card.active } });
  };

  if (loadingVendedor || loadingCards) return <Loading />;
  if (!vendedor) return <p className="text-center text-gray-500 py-8">Vendedor não encontrado.</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendedor</h1>
          <p className="text-sm text-gray-500">Informações e cartões cadastrados</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl p-5 sm:p-6 text-white" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)" }}>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
            {vendedor.nome.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold truncate">{vendedor.nome}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-white/60 text-sm">
              {vendedor.empresa && (
                <span className="flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> {vendedor.empresa}</span>
              )}
              {vendedor.funcao && (
                <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {vendedor.funcao}</span>
              )}
              {vendedor.phone && (
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {vendedor.phone}</span>
              )}
              {vendedor.pixKey && (
                <span className="flex items-center gap-1.5"><Key className="h-3.5 w-3.5" /> {vendedor.pixKey}</span>
              )}
              {vendedor.cpf && (
                <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> CPF: {vendedor.cpf}</span>
              )}
              {vendedor.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {[vendedor.address.rua, vendedor.address.bairro, vendedor.address.cidade, vendedor.address.estado].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            vendedor.active ? "bg-white/20 text-white" : "bg-red-500/80 text-white"
          }`}>
            {vendedor.active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      {/* Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Cartões ({(cards ?? []).length})</h2>
          <Button onClick={() => { reset({ cardType: "VR" as const }); setCardModal(true); }}>
            <Plus className="h-4 w-4" /> Novo Cartão
          </Button>
        </div>

        {(cards ?? []).length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
            <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum cartão cadastrado</p>
            <p className="text-sm text-gray-400 mt-1">Adicione o primeiro cartão deste vendedor</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(cards ?? []).map((card) => (
              <CardItem key={card.id} card={card} onDelete={handleDeleteCard} onToggle={handleToggleCard} />
            ))}
          </div>
        )}
      </div>

      {/* Add Card Modal */}
      <Modal open={cardModal} onClose={() => setCardModal(false)} title="Cadastrar Cartão">
        <form onSubmit={handleSubmit(onCreateCard)} className="space-y-4">
          <Select
            label="Tipo do Cartão *"
            options={[
              { value: "VR", label: "Vale Refeição (VR)" },
              { value: "VA", label: "Vale Alimentação (VA)" },
            ]}
            {...register("cardType")}
          />
          <Select
            label="Bandeira *"
            options={[
              { value: "Alelo", label: "Alelo" },
              { value: "Sodexo", label: "Sodexo" },
              { value: "VR", label: "VR" },
              { value: "Ticket", label: "Ticket" },
              { value: "Flash", label: "Flash" },
              { value: "iFood", label: "iFood Benefícios" },
              { value: "Swile", label: "Swile" },
              { value: "Outro", label: "Outro" },
            ]}
            {...register("cardBrand", { required: "Bandeira é obrigatória" })}
            error={errors.cardBrand?.message}
          />
          <Input
            label="Número do Cartão"
            placeholder="0000 0000 0000 0000"
            {...register("cardNumber")}
            onChange={(e) => {
              const m = maskCardNumber(e.target.value);
              e.target.value = m;
              setValue("cardNumber", m);
            }}
          />
          <Input
            label="Senha do Cartão *"
            type="password"
            placeholder="Senha numérica do cartão"
            {...register("cardPassword", { required: "Senha é obrigatória" })}
            error={errors.cardPassword?.message}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor Mensal (R$)"
              type="number"
              step="0.01"
              placeholder="Ex: 800.00"
              {...register("valorMensal", { valueAsNumber: true })}
            />
            <Input
              label="Dia Vencimento"
              type="number"
              min={1}
              max={31}
              placeholder="Ex: 15"
              {...register("diaVencimento", { valueAsNumber: true })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCardModal(false)}>Cancelar</Button>
            <Button type="submit" loading={createCard.isPending}>Cadastrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CardItem({ card, onDelete, onToggle }: { card: Card; onDelete: (id: string) => void; onToggle: (card: Card) => void }) {
  const [showPass, setShowPass] = useState(false);
  const config = CARD_TYPE_CONFIG[card.cardType] ?? CARD_TYPE_CONFIG.VR;

  return (
    <div className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${config.bg} ${config.border} ${!card.active ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center bg-white shadow-sm ${config.color}`}>
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className={`font-bold text-sm ${config.color}`}>{config.label}</p>
            <p className="text-sm text-gray-600 font-semibold">{card.cardBrand}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggle(card)}
            className={`p-1 rounded-lg transition-colors ${card.active ? "text-green-600 hover:bg-green-100" : "text-red-500 hover:bg-red-100"}`}
            title={card.active ? "Desativar" : "Ativar"}
          >
            {card.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="p-1 rounded-lg hover:bg-white/60 text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {card.cardNumber && (
          <p className="text-xs text-gray-500">Nº: <span className="font-mono font-semibold text-gray-700">{card.cardNumber}</span></p>
        )}
        {card.valorMensal && (
          <p className="text-xs text-gray-500">Valor mensal: <span className="font-semibold text-gray-700">R$ {card.valorMensal.toFixed(2)}</span></p>
        )}
        {card.diaVencimento && (
          <p className="text-xs text-gray-500">Vencimento: dia <span className="font-semibold text-gray-700">{card.diaVencimento}</span></p>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
          card.active ? "bg-white/80 text-green-700" : "bg-white/80 text-red-600"
        }`}>
          {card.active ? "Ativo" : "Inativo"}
        </span>
      </div>
    </div>
  );
}
