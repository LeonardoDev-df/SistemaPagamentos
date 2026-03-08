import { useForm } from "react-hook-form";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { SystemSettings } from "@sistema-pagamentos/shared";

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const { register, handleSubmit } = useForm<Partial<SystemSettings>>({
    values: settings
      ? { defaultFeePercentage: settings.defaultFeePercentage, systemName: settings.systemName }
      : undefined,
  });

  if (isLoading) return <Loading />;

  const onSubmit = async (data: Partial<SystemSettings>) => {
    await updateSettings.mutateAsync(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500">Configurações gerais do sistema</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5"
      >
        <Input label="Nome do Sistema" {...register("systemName")} />
        <Input
          label="Taxa Padrão (%)"
          type="number"
          step="0.1"
          {...register("defaultFeePercentage", { valueAsNumber: true })}
        />
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={updateSettings.isPending}>Salvar</Button>
        </div>
      </form>
    </div>
  );
}
