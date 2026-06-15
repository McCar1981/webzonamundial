"use client";

import Link from "next/link";
import FormularioRegistro from "@/components/FormularioRegistro";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  code: string;
  valid: boolean;
  label: string | null;
  rewardNewUser: number;
}

export default function RegistroCodigoCodeClient({ code, valid, label, rewardNewUser }: Props) {
  const { t } = useLanguage();
  const isEN = t.nav.selecciones === "48 Teams";

  const c = isEN
    ? {
        badge: "Invite code",
        invitedBy: label ? `You were invited by ${label}` : "You were invited to ZonaMundial",
        title: "You're almost in",
        bonus: `Sign up with this code and get ${rewardNewUser} welcome Fútcoins`,
        sub: "Predictions, Fantasy, Trivia and a live Match Center for the 2026 World Cup. Free to join.",
        invalidTitle: "This code is not active",
        invalidSub: "This code isn't valid right now, so you can't sign up with it here. Use the regular sign-up, or ask for a valid code.",
        formTitle: "Create your account",
        formSub: "Your code is already filled in.",
        normalReg: "Go to regular sign-up",
        codeLabel: "Your code",
      }
    : {
        badge: "Código de invitación",
        invitedBy: label ? `Te invita ${label}` : "Te han invitado a ZonaMundial",
        title: "Ya casi estás dentro",
        bonus: `Regístrate con este código y llévate ${rewardNewUser} Fútcoins de bienvenida`,
        sub: "Predicciones, Fantasy, Trivia y un Match Center en vivo para el Mundial 2026. Gratis.",
        invalidTitle: "Este código no está activo",
        invalidSub: "Este código no es válido ahora mismo, así que no puedes registrarte con él aquí. Usa el registro normal o pide un código válido.",
        formTitle: "Crea tu cuenta",
        formSub: "Tu código ya está puesto.",
        normalReg: "Ir al registro normal",
        codeLabel: "Tu código",
      };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[800px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #C9A84C30 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #C9A84C20 0%, transparent 70%)", filter: "blur(100px)" }}
        />
      </div>
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-50"
        style={{ background: "linear-gradient(90deg, transparent, #C9A84C, #A8893D, transparent)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-0 pb-10 sm:pb-16">
        <nav className="text-xs text-gray-500 mb-8 pt-6">
          <ol className="flex gap-2 items-center flex-wrap">
            <li><Link href="/" className="hover:text-[#C9A84C] transition-colors">{isEN ? "Home" : "Inicio"}</Link></li>
            <li className="text-gray-600">/</li>
            <li className="text-[#C9A84C] font-medium">{c.badge}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* IZQUIERDA — invitación + código */}
          <div className="space-y-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
              style={{ background: "#C9A84C15", color: "#C9A84C", border: "1px solid #C9A84C30" }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#C9A84C" }} />
              {c.invitedBy}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              {valid ? c.title : c.invalidTitle}
            </h1>

            {/* Tarjeta del código */}
            <div
              className="p-5 rounded-2xl border flex items-center gap-4"
              style={{ background: "#C9A84C08", borderColor: "#C9A84C25" }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{c.codeLabel}</div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-widest break-all">{code}</div>
              </div>
              {valid && rewardNewUser > 0 && (
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-black text-[#C9A84C] leading-none">+{rewardNewUser}</div>
                  <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">Fútcoins</div>
                </div>
              )}
            </div>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl">
              {valid ? c.bonus : c.invalidSub}
            </p>
            {valid && <p className="text-gray-400 text-sm max-w-xl">{c.sub}</p>}

            <div className="pt-2 text-sm">
              <Link href="/registro" className="text-gray-400 hover:text-[#C9A84C] hover:underline transition-colors">
                {c.normalReg}
              </Link>
            </div>
          </div>

          {/* DERECHA — formulario con código prerelleno */}
          <div className="lg:sticky lg:top-24">
            <div
              className="p-6 sm:p-8 rounded-3xl border overflow-hidden relative"
              style={{
                borderColor: "#C9A84C25",
                background: "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(11,24,37,0.6))",
                backdropFilter: "blur(20px)",
                boxShadow: "0 25px 50px -12px #C9A84C15, 0 0 0 1px #C9A84C10",
              }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">{c.formTitle}</h2>
                <p className="text-sm text-gray-400">{c.formSub}</p>
              </div>
              <FormularioRegistro codigoPreseleccionado={code} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
