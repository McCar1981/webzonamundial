"use client";

// Formulario LIGERO de alta en la porra de un bar.
//
// A diferencia del /login normal de ZM, esta pantalla está pensada para el
// cliente del bar que acaba de escanear el QR: pide lo mínimo (email para
// enlace mágico, o Google/Apple) y NO arrastra el onboarding largo de ZM.
//
// La "trampa": el usuario queda igualmente registrado en ZonaMundial (Supabase
// crea la cuenta con el enlace mágico / OAuth), pero como el destino es la
// página del bar (/b/...), auth/callback marca onboarded_at automáticamente y
// se salta los pasos largos. Al volver autenticado, JoinButton completa la
// unión a la peña y lleva a predecir.

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Theme {
  primary: string;
  primaryInk: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  cardRadius: number;
}

export default function JoinForm({ slug, qr, theme }: { slug: string; qr?: string; theme: Theme }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | "apple" | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const supabase = (() => {
    try {
      return createSupabaseBrowserClient();
    } catch (e) {
      return { __error: (e as Error).message } as const;
    }
  })();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  // Destino tras autenticarse: la página del bar con intención de unirse.
  // auth/callback detecta el prefijo /b/ y se salta el onboarding largo.
  const params = new URLSearchParams();
  if (qr) params.set("qr", qr);
  params.set("join", "1");
  const next = `/b/${slug}?${params.toString()}`;
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
      options: {
        redirectTo: callbackUrl,
        scopes: provider === "apple" ? "name email" : undefined,
        queryParams:
          provider === "google" ? { access_type: "offline", prompt: "consent" } : undefined,
      },
    });
    if (error) {
      setLoading(null);
      const m = error.message || "";
      let human = m;
      if (/provider is not enabled/i.test(m)) {
        human = "Ese método no está activado todavía. Usa el enlace por email de momento.";
      } else if (/redirect_uri/i.test(m)) {
        human = "La URL de retorno no está autorizada todavía. Usa el enlace por email.";
      }
      setError(human);
      console.error(`[bar-join/oauth/${provider}]`, m);
    }
  };

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div
          style={{
            width: 72, height: 72, margin: "0 auto 20px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="#22c55e">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.text, marginBottom: 8 }}>
          Revisa tu email
        </h2>
        <p style={{ fontSize: 14, color: theme.textMuted, marginBottom: 16 }}>
          Te hemos enviado un enlace de acceso a <span style={{ color: theme.primary }}>{email}</span>.
          Haz clic en él y entrarás directo a la porra.
        </p>
        <div
          style={{
            maxWidth: 380, margin: "0 auto 20px", padding: 14, borderRadius: 12,
            textAlign: "left", background: "rgba(201,168,76,0.08)", border: `1px solid ${theme.border}`,
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: theme.primary, marginBottom: 4 }}>
            ¿No lo ves? Revisa SPAM
          </p>
          <p style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.5 }}>
            Como somos un dominio nuevo, algunos proveedores pueden marcarlo como spam. Márcalo como
            &quot;No es spam&quot;. El remitente es noreply@zonamundial.app.
          </p>
        </div>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          style={{ fontSize: 12, color: theme.textMuted, background: "none", border: "none", cursor: "pointer" }}
        >
          Usar otro email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <div
          style={{
            padding: 12, borderRadius: 12, textAlign: "center", fontSize: 13,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
          Tu email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="tu@email.com"
          style={{
            width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 14,
            background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, outline: "none",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading !== null || !email}
        style={{
          width: "100%", padding: "15px 18px", borderRadius: 12, fontWeight: 800, fontSize: 15,
          background: theme.primary, color: theme.primaryInk, border: "none",
          cursor: loading !== null || !email ? "default" : "pointer",
          opacity: loading !== null || !email ? 0.6 : 1,
        }}
      >
        {loading === "email" ? "Enviando enlace…" : "Entrar con email"}
      </button>

      <div style={{ position: "relative", margin: "8px 0", textAlign: "center" }}>
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: `1px solid ${theme.border}` }} />
        <span style={{ position: "relative", padding: "0 12px", fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 1, background: "transparent" }}>
          <span style={{ background: theme.surface, padding: "0 8px" }}>o continúa con</span>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={loading !== null}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 600,
            background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text,
            cursor: loading !== null ? "default" : "pointer", opacity: loading !== null ? 0.5 : 1,
          }}
        >
          <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24">
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
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 600,
            background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text,
            cursor: loading !== null ? "default" : "pointer", opacity: loading !== null ? 0.5 : 1,
          }}
        >
          <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Apple
        </button>
      </div>

      <p style={{ fontSize: 11, color: theme.textMuted, textAlign: "center", lineHeight: 1.5, marginTop: 4 }}>
        Solo necesitas tu email para jugar. Sin formularios largos.
      </p>
    </form>
  );
}
