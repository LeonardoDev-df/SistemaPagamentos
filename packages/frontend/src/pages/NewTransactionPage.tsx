import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCreateTransaction, useUploadReceipt } from "@/hooks/useTransactions";
import { useUsers } from "@/hooks/useUsers";
import { useCards } from "@/hooks/useCards";
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
  const uploadReceipt = useUploadReceipt();
  const { data: vendedores } = useUsers(UserRole.VENDEDOR);
  const { data: settings } = useSettings();

  const [selectedVendedor, setSelectedVendedor] = useState("");
  const { data: cards } = useCards(selectedVendedor || undefined);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTransactionRequest>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      feePercentage: settings?.defaultFeePercentage ?? 15,
      saleDate: new Date().toISOString().split("T")[0],
    },
  });

  // Update fee when settings load
  useEffect(() => {
    if (settings?.defaultFeePercentage) {
      setValue("feePercentage", settings.defaultFeePercentage);
    }
  }, [settings, setValue]);

  const cardBalance = watch("cardBalance");
  const feePercentage = watch("feePercentage") ?? settings?.defaultFeePercentage ?? 15;
  const feeAmount = cardBalance ? Math.round(cardBalance * (feePercentage / 100) * 100) / 100 : 0;
  const netAmount = cardBalance ? Math.round((cardBalance - feeAmount) * 100) / 100 : 0;

  const onSubmit = async (data: CreateTransactionRequest) => {
    const result = await createTransaction.mutateAsync(data);

    // Upload receipt if provided
    if (receiptFile && result?.id) {
      await uploadReceipt.mutateAsync({ id: result.id, file: receiptFile });
    }

    navigate(ROUTES.TRANSACTIONS);
  };

  const vendedorOptions = (vendedores ?? []).map((u) => ({
    value: u.uid,
    label: u.displayName,
  }));

  const cardOptions = (cards ?? []).map((c) => ({
    value: c.id,
    label: `${c.cardType} - ${c.cardBrand}`,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Venda</h1>
          <p className="text-sm text-gray-500">Registrar venda mensal de cartão</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5"
      >
        {/* Step 1: Select vendedor */}
        <Select
          label="Vendedor"
          options={vendedorOptions}
          value={selectedVendedor}
          onChange={(e) => {
            setSelectedVendedor(e.target.value);
            setValue("cardId", ""); // Reset card selection
          }}
        />

        {/* Step 2: Select card (only after vendedor) */}
        {selectedVendedor && (
          <Select
            label="Cartão"
            options={cardOptions}
            error={errors.cardId?.message}
            {...register("cardId")}
          />
        )}

        {/* Step 3: Monthly values */}
        {selectedVendedor && (
          <>
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

            {/* Receipt upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Comprovante
              </label>
              <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-gray-300 hover:border-primary-400 px-4 py-6 cursor-pointer transition-colors bg-gray-50 hover:bg-primary-50/50">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {receiptFile ? receiptFile.name : "Clique para anexar comprovante"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {/* Summary */}
            {cardBalance > 0 && (
              <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-4 sm:p-5 space-y-2.5 border border-primary-200/50">
                <h3 className="text-sm font-bold text-primary-900">Resumo da Venda</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-primary-700">Saldo do cartão:</span>
                  <span className="font-semibold text-primary-900">R$ {cardBalance?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-primary-700">Taxa ({feePercentage}%):</span>
                  <span className="font-semibold text-danger-600">- R$ {feeAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-primary-200/50 pt-2.5">
                  <span className="font-bold text-primary-900">Valor a pagar ao vendedor:</span>
                  <span className="font-bold text-lg text-success-600">R$ {netAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button
            type="submit"
            loading={createTransaction.isPending || uploadReceipt.isPending}
            disabled={!selectedVendedor}
          >
            Registrar Venda
          </Button>
        </div>
      </form>
    </div>
  );
}
