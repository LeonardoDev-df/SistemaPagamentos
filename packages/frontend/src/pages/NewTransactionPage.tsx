import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCreateTransaction, useUploadReceipt } from "@/hooks/useTransactions";
import { useVendedores } from "@/hooks/useVendedores";
import { useCards } from "@/hooks/useCards";
import { useSettings } from "@/hooks/useSettings";
import {
  createTransactionSchema,
  CreateTransactionRequest,
} from "@sistema-pagamentos/shared";
import { ROUTES } from "@/config/routes";

export function NewTransactionPage() {
  const navigate = useNavigate();
  const createTransaction = useCreateTransaction();
  const uploadReceipt = useUploadReceipt();
  const { data: vendedores } = useVendedores();
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

    if (receiptFile && result?.id) {
      try {
        await uploadReceipt.mutateAsync({ id: result.id, file: receiptFile });
      } catch {
        // Receipt upload failed but transaction was created successfully
      }
    }

    navigate(ROUTES.TRANSACTIONS);
  };

  const vendedorOptions = (vendedores ?? [])
    .filter((v) => v.active)
    .map((v) => ({
      value: v.id,
      label: v.nome + (v.empresa ? ` (${v.empresa})` : ""),
    }));

  const activeCards = (cards ?? []).filter((c) => c.active);
  const cardOptions = activeCards.map((c) => ({
    value: c.id,
    label: `${c.cardType} - ${c.cardBrand}${c.cardNumber ? ` (${c.cardNumber.slice(-4)})` : ""}${c.valorMensal ? ` - R$ ${c.valorMensal.toFixed(2)}` : ""}`,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Venda</h1>
          <p className="text-sm text-gray-500">Registrar compra mensal de cartão</p>
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
            setValue("cardId", "");
          }}
        />

        {/* Step 2: Select card */}
        {selectedVendedor && (
          <Select
            label="Cartão"
            options={cardOptions}
            error={errors.cardId?.message}
            {...register("cardId", {
              onChange: (e) => {
                const selected = activeCards.find((c) => c.id === e.target.value);
                if (selected?.valorMensal) {
                  setValue("cardValue", selected.valorMensal);
                  setValue("cardBalance", selected.valorMensal);
                }
              },
            })}
          />
        )}

        {/* Step 3: Monthly values */}
        {selectedVendedor && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Saldo Comprado (R$)"
                type="number"
                step="0.01"
                error={errors.cardBalance?.message}
                {...register("cardBalance", {
                  valueAsNumber: true,
                  onChange: (e) => setValue("cardValue", Number(e.target.value) || 0),
                })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Desconto (%)"
                type="number"
                step="0.1"
                error={errors.feePercentage?.message}
                {...register("feePercentage", { valueAsNumber: true })}
              />
              <Input
                label="Data da Compra"
                type="date"
                error={errors.saleDate?.message}
                {...register("saleDate")}
              />
            </div>

            {/* Receipt upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Comprovante (opcional)
              </label>
              <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-gray-300 hover:border-accent-400 px-4 py-6 cursor-pointer transition-colors bg-gray-50 hover:bg-accent-50/50">
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
              <div className="bg-gradient-to-br from-accent-50 to-accent-100/50 rounded-xl p-4 sm:p-5 space-y-2.5 border border-accent-200/50">
                <h3 className="text-sm font-bold text-primary-800">Resumo da Compra</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-primary-600">Saldo do cartão:</span>
                  <span className="font-semibold text-primary-800">R$ {cardBalance?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-primary-600">Desconto ({feePercentage}%):</span>
                  <span className="font-semibold text-danger-600">- R$ {feeAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-accent-300/50 pt-2.5">
                  <span className="font-bold text-primary-800">Valor a pagar ao vendedor:</span>
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
            Registrar Compra
          </Button>
        </div>
      </form>
    </div>
  );
}
