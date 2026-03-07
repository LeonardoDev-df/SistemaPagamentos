import { useForm } from "react-hook-form";
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
      ? {
          defaultFeePercentage: settings.defaultFeePercentage,
          systemName: settings.systemName,
        }
      : undefined,
  });

  if (isLoading) return <Loading />;

  const onSubmit = async (data: Partial<SystemSettings>) => {
    await updateSettings.mutateAsync(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
      >
        <Input
          label="Nome do Sistema"
          {...register("systemName")}
        />
        <Input
          label="Taxa Padrão (%)"
          type="number"
          step="0.1"
          {...register("defaultFeePercentage", { valueAsNumber: true })}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" loading={updateSettings.isPending}>
            Salvar Configurações
          </Button>
        </div>
      </form>
    </div>
  );
}
