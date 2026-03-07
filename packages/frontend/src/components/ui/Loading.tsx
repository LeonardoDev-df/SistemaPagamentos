import { Loader2 } from "lucide-react";

export function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      <p className="text-sm text-gray-400">Carregando...</p>
    </div>
  );
}
