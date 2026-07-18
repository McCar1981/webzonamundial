"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeOnboardingAction, skipOnboardingAction } from "./actions";
import { subscribeToPush, claimPushReward } from "@/lib/push-client";

const PUSH_REWARD_COINS = 25;

interface CountryOption {
  code: string;
  name: string;
}
interface SeleccionOption {
  slug: string;
  nombre: string;
  flagCode: string;
  grupo: string;
}
interface State {
  username: string;
  country: string;
  locale: "es" | "en";
  birth_date: string;
  fav_team: string;
}

export default function OnboardingWizard({
  email,
  initialUsername,
  countries,
  selecciones,
}: {
  email: string;
  initialUsername: string;
  countries: CountryOption[];
  selecciones: SeleccionOption[];
}) {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  // Destino al terminar onboarding (lo pasamos desde el callback OAuth si
  // el usuario venía de pedir una ruta específica antes de loguearse).
  const nextParam = searchParamsHook.get("next");
  const finishDestination =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/app";
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [state, setState] = useState<State>({
    username: initialUsername,
    country: "",
    locale: "es",
    birth_date: "",
    fav_team: "",
  });

  function set<K extends keyof State>(key: K, value: State[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setError("");
  }

  function validateStep1(): string | null {
    const cleaned = state.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleaned.length < 3) {
      return "Tu nombre de usuario debe tener al menos 3 caracteres (a-z, 0-9, _).";
    }
    return null;
  }

  function nextFromStep1() {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setStep(2);
  }

  function finish() {
    setError("");
    const fd = new FormData();
    Object.entries(state).forEach(([k, v]) => fd.set(k, v));

    startTransition(async () => {
      const res = await completeOnboardingAction(fd);
      if (res.ok) {
        router.push(finishDestination);
        router.refresh();
      } else {
        setError(res.error ?? "Error completando onboarding");
      }
    });
  }

  function skip() {
    startTransition(async () => {
      await skipOnboardingAction(finishDestination);
      // skip redirige, no llega aquí
    });
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[1, 2, 3, 4].map((n) => {
          const active = step === n;
          const done = step > n;
          return (
            <div key={n} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all"
                style={{
                  background: active || done
                    ? "linear-gradient(135deg, #C9A84C, #A8893D)"
                    : "rgba(15,23,42,0.6)",
                  color: active || done ? "#030712" : "#6a7a9a",
                  border: active ? "2px solid #FDE68A" : "2px solid transparent",
                }}
              >
                {done ? "✓" : n}
              </div>
              {n < 3 && (
                <div
                  className="w-12 h-0.5"
                  style={{
                    background: step > n ? "#C9A84C" : "#1E293B",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        className="rounded-3xl border border-[#C9A84C]/20 p-7 sm:p-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(11,24,37,0.6))",
          backdropFilter: "blur(20px)",
          boxShadow: "0 25px 50px -12px rgba(201,168,76,0.1)",
        }}
      >
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {step === 1 && (
          <Step1
            email={email}
            username={state.username}
            onChangeUsername={(v) => set("username", v)}
            onNext={nextFromStep1}
            onSkip={skip}
            skipPending={pending}
          />
        )}
        {step === 2 && (
          <Step2
            country={state.country}
            locale={state.locale}
            birth_date={state.birth_date}
            countries={countries}
            onChange={set}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3
            fav_team={state.fav_team}
            selecciones={selecciones}
            onChange={set}
            onBack={() => setStep(2)}
            onFinish={() => setStep(4)}
            pending={pending}
          />
        )}

        {step === 4 && <Step4 onFinish={finish} pending={pending} />}
      </div>

      <div className="text-center mt-6">
        <button
          onClick={skip}
          disabled={pending}
          className="text-xs text-gray-500 hover:text-[#C9A84C] transition-colors disabled:opacity-50"
        >
          Saltar y completar más tarde
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   STEP 1 — Bienvenida + username
─────────────────────────────────────────────────────────────────── */
function Step1({
  email,
  username,
  onChangeUsername,
  onNext,
  onSkip,
  skipPending,
}: {
  email: string;
  username: string;
  onChangeUsername: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
  skipPending: boolean;
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A84C]/30 text-xs font-bold text-[#C9A84C] tracking-wider uppercase mb-5"
          style={{ background: "rgba(201,168,76,0.05)" }}>
          <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
          Paso 1 de 3
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
          ¡Bienvenido al{" "}
          <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
            Mundial
          </span>
          !
        </h1>
        <p className="text-gray-400 text-sm">
          Vamos a personalizar tu cuenta en menos de 1 minuto.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Tu email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-[#0B1825]/60 border border-[#1E293B] text-gray-300 text-sm cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Elige tu nombre de usuario
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => onChangeUsername(e.target.value)}
            maxLength={30}
            className="w-full px-4 py-3 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/40"
            placeholder="tunombre"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            3-30 caracteres. Letras, números y guion bajo.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
        <button
          onClick={onSkip}
          disabled={skipPending}
          className="px-5 py-3 rounded-xl border border-[#1E293B] text-gray-400 font-semibold text-sm hover:border-[#C9A84C]/30 hover:text-gray-300 transition-all disabled:opacity-50"
        >
          Más tarde
        </button>
        <button
          onClick={onNext}
          disabled={!username.trim()}
          className="flex-1 px-6 py-3 rounded-xl text-[#030712] font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
        >
          Continuar
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   STEP 2 — País + idioma + fecha de nacimiento
─────────────────────────────────────────────────────────────────── */
function Step2({
  country,
  locale,
  birth_date,
  countries,
  onChange,
  onBack,
  onNext,
}: {
  country: string;
  locale: "es" | "en";
  birth_date: string;
  countries: CountryOption[];
  onChange: <K extends keyof State>(k: K, v: State[K]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A84C]/30 text-xs font-bold text-[#C9A84C] tracking-wider uppercase mb-5"
          style={{ background: "rgba(201,168,76,0.05)" }}>
          <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
          Paso 2 de 3
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          ¿Desde dónde nos sigues?
        </h2>
        <p className="text-gray-400 text-sm">
          Esto nos ayuda a recomendarte rivales locales.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            País
          </label>
          <select
            value={country}
            onChange={(e) => onChange("country", e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none"
          >
            <option value="">— Selecciona país —</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Idioma
          </label>
          <div className="flex gap-2">
            {(["es", "en"] as const).map((lang) => {
              const active = locale === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onChange("locale", lang)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all border"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, #C9A84C, #A8893D)"
                      : "transparent",
                    color: active ? "#030712" : "#cbd5e1",
                    borderColor: active ? "#C9A84C" : "#1E293B",
                  }}
                >
                  {lang === "es" ? "🇪🇸 Español" : "🇬🇧 English"}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            value={birth_date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => onChange("birth_date", e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Opcional. Solo se usa para verificar la mayoría de edad cuando una función lo requiere.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl border border-[#1E293B] text-gray-400 font-semibold text-sm hover:border-[#C9A84C]/30 hover:text-gray-300 transition-all"
        >
          ← Atrás
        </button>
        <button
          onClick={onNext}
          className="flex-1 px-6 py-3 rounded-xl text-[#030712] font-bold text-sm transition-all flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
        >
          Continuar
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   STEP 3 — Selección favorita
─────────────────────────────────────────────────────────────────── */
function Step3({
  fav_team,
  selecciones,
  onChange,
  onBack,
  onFinish,
  pending,
}: {
  fav_team: string;
  selecciones: SeleccionOption[];
  onChange: <K extends keyof State>(k: K, v: State[K]) => void;
  onBack: () => void;
  onFinish: () => void;
  pending: boolean;
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A84C]/30 text-xs font-bold text-[#C9A84C] tracking-wider uppercase mb-5"
          style={{ background: "rgba(201,168,76,0.05)" }}>
          <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
          Paso 3 de 3
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          Tus colores
        </h2>
        <p className="text-gray-400 text-sm">
          Elige la selección con la que vibras.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Selección favorita
          </label>
          <select
            value={fav_team}
            onChange={(e) => onChange("fav_team", e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none"
          >
            <option value="">— Sin selección favorita —</option>
            {selecciones.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.nombre} (Grupo {s.grupo})
              </option>
            ))}
          </select>
        </div>

      </div>

      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={onBack}
          disabled={pending}
          className="px-5 py-3 rounded-xl border border-[#1E293B] text-gray-400 font-semibold text-sm hover:border-[#C9A84C]/30 hover:text-gray-300 transition-all disabled:opacity-50"
        >
          ← Atrás
        </button>
        <button
          onClick={onFinish}
          disabled={pending}
          className="flex-1 px-6 py-3 rounded-xl text-[#030712] font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
        >
          Continuar
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   STEP 4 — Activar notificaciones (con recompensa de Fútcoins)
─────────────────────────────────────────────────────────────────── */
function Step4({ onFinish, pending }: { onFinish: () => void; pending: boolean }) {
  const [pushState, setPushState] = useState<"idle" | "loading" | "done" | "denied">("idle");
  const [earned, setEarned] = useState(0);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Si el navegador no soporta push o ya está concedido/bloqueado, no tiene
    // sentido el paso: completamos directamente.
    if (typeof window === "undefined") return;
    const ok = "Notification" in window && "serviceWorker" in navigator;
    if (!ok || Notification.permission !== "default") setSupported(false);
  }, []);

  async function activate() {
    setPushState("loading");
    try {
      const sub = await subscribeToPush({ kinds: ["news", "tournament-key-events"] });
      if (sub) {
        const reward = await claimPushReward();
        setEarned(reward && !reward.alreadyClaimed ? reward.coins : 0);
        setPushState("done");
        setTimeout(onFinish, 1300);
      } else {
        setPushState("denied");
      }
    } catch {
      setPushState("denied");
    }
  }

  const busy = pushState === "loading" || pending;

  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🔔</div>
        <h2 className="text-2xl font-black text-white mb-2">Una última cosa</h2>
        {pushState === "done" ? (
          <p className="text-[#E8D48B] font-bold">
            {earned > 0 ? `¡+${earned} Fútcoins! Entrando…` : "¡Listo! Entrando…"}
          </p>
        ) : pushState === "denied" ? (
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            No pasa nada: puedes activarlas cuando quieras desde tu perfil. Entrando…
          </p>
        ) : (
          <p className="text-gray-300 text-sm max-w-sm mx-auto">
            Activa las notificaciones y entérate al instante de cada gol, las alineaciones y cuando se
            resuelven tus predicciones.{" "}
            {supported && (
              <span className="text-[#E8D48B] font-semibold">
                Te llevas {PUSH_REWARD_COINS} Fútcoins por activarlas.
              </span>
            )}
          </p>
        )}
      </div>

      {supported && pushState !== "done" && pushState !== "denied" ? (
        <div className="space-y-3">
          <button
            onClick={activate}
            disabled={busy}
            className="w-full px-6 py-3 rounded-xl text-[#030712] font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
          >
            {pushState === "loading" ? "Activando…" : `Activar notificaciones · +${PUSH_REWARD_COINS} 🪙`}
          </button>
          <button
            onClick={onFinish}
            disabled={busy}
            className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            Ahora no, empezar a jugar
          </button>
        </div>
      ) : (
        <button
          onClick={onFinish}
          disabled={pending && pushState !== "done"}
          className="w-full px-6 py-3 rounded-xl text-[#030712] font-bold text-sm transition-all disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
        >
          {pending ? "Entrando…" : "Empezar a jugar"}
        </button>
      )}
    </div>
  );
}
