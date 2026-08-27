import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type PageProps = {
  searchParams?: Promise<{
    token?: string | string[];
  }>;
};

async function resolveToken(value: string | string[] | undefined): Promise<string> {
  const resolvedValue = Array.isArray(value) ? value[0] ?? "" : value ?? "";
  return decodeURIComponent(resolvedValue).trim();
}

async function verifyToken(token: string): Promise<{ valid: boolean; name?: string }> {
  if (!token || !API_BASE_URL) {
    return { valid: false };
  }

  const response = await fetch(`${API_BASE_URL}/profile/credential/verify?token=${encodeURIComponent(token)}`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    return { valid: false };
  }

  const payload = (await response.json()) as {
    success?: boolean;
    data?: {
      valid?: boolean;
      user?: {
        firstName?: string;
        lastName?: string;
      };
    };
  };

  if (!payload.success || payload.data?.valid !== true || !payload.data?.user) {
    return { valid: false };
  }

  const fullName = [payload.data.user.firstName, payload.data.user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return { valid: true, name: fullName || "Usuario" };
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const token = await resolveToken(params.token);
  const verification = token ? await verifyToken(token) : { valid: false };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-12 text-[var(--text-primary)]">
      <div className="w-full max-w-[720px] rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)] md:p-10">
        <div className="mb-5 flex items-center gap-3 text-[var(--brand-700)]">
          <span className="font-[family-name:var(--font-spectral)] text-[2.2rem] leading-none text-[var(--brand-500)]">∫</span>
          <span className="font-[family-name:var(--font-spectral)] text-[1.25rem] font-medium text-[var(--text-primary)]">
            Mathesis
          </span>
        </div>

        <div className="space-y-4">
          <span className="inline-flex rounded-full border border-[var(--line-strong)] bg-[var(--surface-muted)] px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Verificación de credencial
          </span>

          <h1 className="font-[family-name:var(--font-spectral)] text-[2.2rem] font-semibold leading-none text-[var(--text-primary)]">
            {verification.valid ? "Credencial válida" : "Credencial no válida"}
          </h1>

          <p className="text-base text-[var(--text-secondary)]">
            {verification.valid ? (
              <>
                Se verificó la identidad asociada a esta credencial y el perfil activo corresponde a
                <span className="font-semibold text-[var(--text-primary)]"> {verification.name}</span>.
              </>
            ) : (
              "El enlace de verificación no es válido o ha expirado. Solicita una nueva credencial para continuar."
            )}
          </p>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-4">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              Estado
            </p>
            <p className="mt-2 text-base font-medium text-[var(--text-primary)]">
              {verification.valid ? "Verificación válida" : "No verificada"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/perfil"
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand-500)] px-5 py-2.5 text-sm font-semibold text-[var(--navy-900)] transition hover:bg-[var(--brand-300)]"
          >
            Volver a mi perfil
          </Link>
          <Link
            href="/perfil/credencial"
            className="inline-flex items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]"
          >
            Ver credencial
          </Link>
        </div>
      </div>
    </main>
  );
}
