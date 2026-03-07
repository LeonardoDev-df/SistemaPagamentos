import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Plus, CreditCard, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { useUser } from "@/hooks/useUsers";
import { useCards, useCreateCard, useDeleteCard } from "@/hooks/useCards";
import { CreateCardRequest, Card } from "@sistema-pagamentos/shared";

const CARD_TYPE_LABELS: Record<string, string> = {
  VR: "Vale Refeição",
  VA: "Vale Alimentação",
};

export function VendedorDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { data: vendedor, isLoading: loadingUser } = useUser(uid!);
  const { data: cards, isLoading: loadingCards } = useCards(uid);
  const createCard = useCreateCard();
  const deleteCard = useDeleteCard();

  const [cardModal, setCardModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<CreateCardRequest, "vendedorId">>({
    defaultValues: { cardType: "VR" as const },
  });

  const onCreateCard = async (data: Omit<CreateCardRequest, "vendedorId">) => {
    await createCard.mutateAsync({ ...data, vendedorId: uid! });
    setCardModal(false);
    reset();
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Remover este cartão?")) return;
    await deleteCard.mutateAsync(cardId);
  };

  if (loadingUser || loadingCards) return <Loading />;
  if (!vendedor) return <p className="text-center text-gray-500 py-8">Vendedor não encontrado.</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{vendedor.displayName}</h1>
          <p className="text-sm text-gray-500">{vendedor.email}</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Telefone</p>
            <p className="font-medium text-gray-900">{vendedor.phone || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Chave PIX</p>
            <p className="font-medium text-gray-900">{vendedor.pixKey || "-"}</p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Cartões</h2>
          <Button size="sm" onClick={() => { reset(); setCardModal(true); }}>
            <Plus className="h-4 w-4" /> Novo Cartão
          </Button>
        </div>

        {(cards ?? []).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
            Nenhum cartão cadastrado. Adicione o primeiro cartão.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(cards ?? []).map((card) => (
              <CardItem key={card.id} card={card} onDelete={handleDeleteCard} />
            ))}
          </div>
        )}
      </div>

      {/* Add Card Modal */}
      <Modal open={cardModal} onClose={() => setCardModal(false)} title="Novo Cartão">
        <form onSubmit={handleSubmit(onCreateCard)} className="space-y-4">
          <Select
            label="Tipo do Cartão"
            options={[
              { value: "VR", label: "Vale Refeição (VR)" },
              { value: "VA", label: "Vale Alimentação (VA)" },
            ]}
            {...register("cardType")}
          />
          <Input
            label="Bandeira"
            placeholder="Ex: Alelo, Sodexo, VR, Ticket"
            {...register("cardBrand", { required: "Bandeira é obrigatória" })}
            error={errors.cardBrand?.message}
          />
          <Input
            label="Senha do Cartão"
            type="password"
            {...register("cardPassword", { required: "Senha é obrigatória" })}
            error={errors.cardPassword?.message}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCardModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createCard.isPending}>
              Cadastrar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CardItem({ card, onDelete }: { card: Card; onDelete: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
            card.cardType === "VR" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
          }`}>
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">
              {CARD_TYPE_LABELS[card.cardType]} ({card.cardType})
            </p>
            <p className="text-xs text-gray-500">{card.cardBrand}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(card.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          card.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {card.active ? "Ativo" : "Inativo"}
        </span>
      </div>
    </div>
  );
}
