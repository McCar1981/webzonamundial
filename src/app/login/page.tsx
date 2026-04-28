"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/*
  /login

  Magic-link email + Google + Apple OAuth.

  Magic link will create the user automatically on first signup, so this
  page doubles as the "signup" entry. Profile data (nombre, creador) is
  still captured at /registro before the user clicks the email link.

  Required env:
    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY
    NEXT_PUBLIC_SITE_URL                 (https://zonamundial.app)

  Required Supabase Dashboard config:
    Auth > URL Configuration:
      - Site URL: https://zonamundial.app
      - Redirect URLs: https://zonamundial.app/auth/callback
    Auth > Providers:
      - Email: enabled (magic link)
      - Google: enabled with Google Cloud OAuth client ID/secret
      - Apple: enabled with Apple Service ID + private key
*/

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | "apple" | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const supabase = (() => {
    try {
      return createSupabaseBrowserClient();
    } catch (e) {
      // Surface the config error in the UI rather than crashing the page.
      return { __error: (e as Error).message } as const;
    }
  })();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const callbackUrl = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if ("__error" in supabase) {
      setError(supabase.__error);
      return;
    }
    setError("");
    setLoading("email");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: callbackUrl },
    });
    setLoading(null);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    if ("__error" in supabase) {
      setError(supabase.__error);
      return;
    }
    setError("");
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setLoading(null);
      setError(error.message);
    }
    // On success the browser is redirected to the provider; no further code runs.
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))",
            border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="#22c55e">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Revisa tu email</h2>
        <p className="text-gray-400 text-sm mb-6">
          Te hemos enviado un enlace de acceso a{" "}
          <span className="text-[#C9A84C]">{email}</span>. Haz clic en el enlace para iniciar sesión.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="text-xs text-gray-500 hover:text-[#C9A84C]"
        >
          Volver a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleEmail} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          className="w-full px-4 py-3.5 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all placeholder:text-gray-600"
          placeholder="tu@email.com"
        />
      </div>

      <button
        type="submit"
        disabled={loading !== null || !email}
        className="w-full py-4 rounded-xl text-[#030712] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-[#C9A84C]/25 hover:scale-[1.02] active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
      >
        {loading === "email" ? "Enviando enlace…" : "Recibir enlace de acceso"}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#1E293B]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-[#0F1D32] text-gray-500 uppercase tracking-wider">
            o continúa con
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1E293B] bg-[#0B1825] text-white text-sm font-semibold hover:border-[#C9A84C]/40 transition-all disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("apple")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1E293B] bg-[#0B1825] text-white text-sm font-semibold hover:border-[#C9A84C]/40 transition-all disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Apple
        </button>
      </div>

      <div className="text-center pt-4 border-t border-[#1E293B]/50">
        <span className="text-xs text-gray-500">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="text-[#C9A84C] hover:underline font-bold transition-colors"
          >
            Pre-regístrate
          </Link>
        </span>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 sm:px-6 pt-16 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Iniciar{" "}
            <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
              sesión
            </span>
          </h1>
          <p className="text-gray-400 text-sm">
            Accede a tu cuenta de ZonaMundial
          </p>
        </div>

        <div
          className="p-7 sm:p-9 rounded-3xl border border-[#C9A84C]/20"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(11,24,37,0.6))",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 50px -12px rgba(201,168,76,0.1)",
          }}
        >
          <Suspense fallback={<div className="text-gray-400 text-sm text-center">Cargando…</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
