import Link from "next/link";
import { BRAND_LOGO_SRC } from "@/lib/assets";
import { maskEmailForDisplay, resolveEmailParam } from "@/lib/utils/email";

type PageProps = {
  searchParams?: {
    email?: string | string[];
  };
};

export default function ForgotPasswordSentPage({ searchParams }: PageProps) {
  const email = resolveEmailParam(searchParams?.email);
  const maskedEmail = email ? maskEmailForDisplay(email) : null;

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}
    >
      <section className="flex min-h-screen w-full flex-col lg:flex-row">
        <div className="px-8 pb-10 pt-9 lg:hidden" style={{ backgroundColor: "var(--navy-900)" }}>
          <Link
            href="/login"
            className="inline-flex text-xs font-bold uppercase tracking-[0.16em] text-[#C9A84C] transition hover:opacity-80"
          >
            ← Atrás
          </Link>
          <h1 className="mt-3 font-[family-name:Georgia] text-[1.35rem] leading-[1.08] font-bold text-[#FAF8F5]">
            Revisa tu correo
          </h1>
          <div className="mt-6 h-1 w-full rounded-full bg-[#C9A84C]" />
        </div>

        <div
          className="relative hidden overflow-hidden text-center lg:flex lg:w-2/5 lg:shrink-0 lg:flex-col lg:justify-between lg:px-12 lg:py-14 lg:text-left"
          style={{ backgroundColor: "var(--navy-900)" }}
        >
          <span
            className="pointer-events-none absolute right-[-92px] top-[-52px] hidden h-56 w-56 rounded-full border lg:block"
            style={{ borderColor: "color-mix(in srgb, var(--brand-500) 26%, transparent)" }}
          />
          <span
            className="pointer-events-none absolute bottom-[-94px] left-[58%] hidden h-56 w-56 rounded-full border lg:block"
            style={{ borderColor: "color-mix(in srgb, var(--brand-500) 24%, transparent)" }}
          />

          <div className="relative z-10 flex flex-col items-center lg:flex-row lg:items-center lg:gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO_SRC}
              alt="Logo Mathesis"
              width={40}
              height={40}
              loading="eager"
              decoding="async"
              className="mx-auto h-16 w-16 lg:mx-0 lg:h-9 lg:w-9"
            />
            <p className="mt-2 font-[family-name:Georgia] text-xl font-bold tracking-[0.1em] text-[#FAF8F5] lg:mt-0 lg:text-xl">
              Mathesis
            </p>
          </div>

          <div className="relative z-10 mt-10 lg:mt-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C9A84C]">Recuperar acceso</p>
            <h1 className="mt-4 font-[family-name:Georgia] text-[2.2rem] font-bold leading-tight text-[#FAF8F5] lg:max-w-[350px] lg:text-[3.15rem] lg:leading-[1.08]">
              Revisa tu correo
            </h1>
            <p className="mx-auto mt-4 max-w-[370px] font-[family-name:Georgia] text-base italic leading-relaxed text-[#D7DCE3] lg:mx-0 lg:max-w-xs lg:text-sm">
              Si tu email esta registrado, te mandaremos un link para restablecer tu contraseña.
            </p>
          </div>

          <p className="relative z-10 mt-10 text-[0.66rem] text-[#8EA0B6] lg:mt-0">mathesis.social</p>
        </div>

        <div
          className="flex flex-1 flex-col px-8 pb-8 pt-8 lg:justify-center lg:px-14 lg:py-14"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <div className="w-full lg:mx-auto lg:max-w-[440px]">
            <div className="mt-0 lg:mt-0">
              <h2
                className="hidden font-[family-name:Georgia] text-[1.35rem] font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Te enviamos el link
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {maskedEmail ? (
                  <>
                    Enviamos instrucciones a <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{maskedEmail}</span> para que puedas crear una nueva contraseña.
                  </>
                ) : (
                  <>Enviamos instrucciones para que puedas crear una nueva contraseña.</>
                )}
              </p>
              <p className="mt-3 text-xs leading-relaxed lg:text-xs" style={{ color: "var(--text-soft)" }}>
                Si no ves el correo, revisa spam o promociones.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 lg:mt-7 lg:gap-3">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-[#1A1A1A] transition hover:brightness-95 lg:text-sm"
                style={{ backgroundColor: "var(--brand-500)" }}
              >
                Volver a ingresar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
