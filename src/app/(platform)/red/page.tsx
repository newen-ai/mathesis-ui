import { AppCard } from "@/components/ui/AppCard";
import { ModulePage } from "../_components/ModulePage";

export default function RedPage() {
  return (
    <ModulePage
      title="Tu Red"
      subtitle="Gestiona conexiones estrategicas entre miembros de Mensa Argentina."
    >
      <AppCard className="p-5">
        <h2 className="font-display text-xl font-semibold text-slate-900">
          Sugerencias de conexion
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Proximamente: recomendaciones de perfiles en base a experiencia y afinidad profesional.
        </p>
      </AppCard>

      <AppCard className="p-5">
        <h2 className="font-display text-xl font-semibold text-slate-900">
          Frase de comunidad
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          &quot;Conectar mentes brillantes es acelerar soluciones reales&quot;.
        </p>
      </AppCard>
    </ModulePage>
  );
}
