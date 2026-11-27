import { AppCard } from "@/components/ui/AppCard";

export function ActivityCard() {
  return (
    <AppCard className="p-5">
      <h3 className="font-display text-lg font-semibold text-slate-900">
        Actividad destacada
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        &quot;Las ideas complejas necesitan redes simples para escalar&quot;.
      </p>
      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-500">
        <span>112 reacciones</span>
        <span>24 comentarios</span>
        <span>9 compartidos</span>
      </div>
    </AppCard>
  );
}
