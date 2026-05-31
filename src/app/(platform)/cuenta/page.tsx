import { ModulePage } from "../_components/ModulePage";
import { CuentaView } from "../_components/home/CuentaView";

export default function CuentaPage() {
  return (
    <ModulePage
      title="Cuenta"
      subtitle="Edita tu nombre y apellido para que se reflejen en la sesión y en tu registro mock."
    >
      <CuentaView />
    </ModulePage>
  );
}
