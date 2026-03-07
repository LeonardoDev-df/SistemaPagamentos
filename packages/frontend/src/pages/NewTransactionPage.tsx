import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { useUsers } from "@/hooks/useUsers";
import { useSettings } from "@/hooks/useSettings";
import {
  createTransactionSchema,
  CreateTransactionRequest,
  UserRole,
} from "@sistema-pagamentos/shared";
import { ROUTES } from "@/config/routes";

export function NewTransactionPage() {
  const navigate = useNavigate();
  const createTransaction = useCreateTransaction();
  const { data: users } = useUsers(UserRole.COMPRADOR);
  const { data: settings } = useSettings();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateTransactionRequest>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      feePercentage: settings?.defaultFeePercentage ?? 15,
      saleDate: new Date().toISOString().split("T")[0],
    },
  });

  const cardBalance = watch("cardBalance");
  const feePercentage = watch("feePercentage") ?? settings?.defaultFeePercentage ?? 15;
  const feeAmount = cardBalance ? Math.round(cardBalance * (feePercentage / 100) * 100) / 100 : 0;
  const netAmount = cardBalance ? Math.round((cardBalance - feeAmount) * 100) / 100 : 0;

  const onSubmit = async (data: CreateTransactionRequest) => {
    await createTransaction.mutateAsync(data);
    navigate(ROUTES.TRANSACTIONS);
  };

  const compradorOptions = (users ?? []).map((u) => ({
    value: u.uid,
    label: u.displayName,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nova Transação</h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Comprador"
            options={compradorOptions}
            error={errors.compradorId?.message}
            {...register("compradorId")}
          />
          <Select
            label="Tipo do Cartão"
            options={[
              { value: "VR", label: "Vale Refeição (VR)" },
              { value: "VA", label: "Vale Alimentação (VA)" },
            ]}
            error={errors.cardType?.message}
            {...register("cardType")}
          />
        </div>

        <Input
          label="Bandeira"
          placeholder="Ex: Alelo, Sodexo, VR, Ticket"
          {...register("cardBrand")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Valor do Cartão (R$)"
            type="number"
            step="0.01"
            error={errors.cardValue?.message}
            {...register("cardValue", { valueAsNumber: true })}
          />
          <Input
            label="Saldo do Cartão (R$)"
            type="number"
            step="0.01"
            error={errors.cardBalance?.message}
            {...register("cardBalance", { valueAsNumber: true })}
          />
        </div>

        <Input
          label="Senha do Cartão"
          type="password"
          error={errors.cardPassword?.message}
          {...register("cardPassword")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Taxa (%)"
            type="number"
            step="0.1"
            error={errors.feePercentage?.message}
            {...register("feePercentage", { valueAsNumber: true })}
          />
          <Input
            label="Data da Venda"
            type="date"
            error={errors.saleDate?.message}
            {...register("saleDate")}
          />
        </div>

        {cardBalance > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Resumo</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Saldo do cartão:</span>
              <span className="font-medium">R$ {cardBalance?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Taxa ({feePercentage}%):</span>
              <span className="font-medium text-red-600">- R$ {feeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-700 font-medium">Valor líquido (devolver):</span>
              <span className="font-bold text-green-600">R$ {netAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" loading={createTransaction.isPending}>
            Criar Transação
          </Button>
        </div>
      </form>
    </div>
  );
}
