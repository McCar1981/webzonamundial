// /auth/debug
//
// Página de diagnóstico de la configuración de autenticación.
// Server component que comprueba en runtime qué variables de entorno
// están presentes y verifica los providers OAuth contra el JWKS público
// de Supabase. NO expone secrets — solo dice "presente / ausente".
//
// Útil para depurar cuando los botones de Google/Apple dan error y no
// está claro si el problema es código, env vars en Vercel o config en
// el dashboard de Supabase / Google Cloud / Apple Developer.

import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Auth Debug | ZonaMundial",
  description: "Diagnóstico de configuración de autenticación.",
  robots: { index: false, follow: false, nocache: true },
};

interface CheckResult {
  label: string;
  ok: boolean;
  detail: string;
}

async function runChecks(): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];

  // ── 1. ENV vars en Vercel ─────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const appleClientId = process.env.APPLE_CLIENT_ID || "";

  checks.push({
    label: "NEXT_PUBLIC_SUPABASE_URL",
    ok: !!supabaseUrl && supabaseUrl.startsWith("https://"),
    detail: supabaseUrl
      ? `presente — ${supabaseUrl.slice(0, 30)}...`
      : "AUSENTE: el cliente del navegador no podrá conectar con Supabase",
  });
  checks.push({
    label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ok: !!anonKey && anonKey.length > 40,
    detail: anonKey ? `presente (${anonKey.length} chars)` : "AUSENTE",
  });
  checks.push({
    label: "SUPABASE_SERVICE_ROLE_KEY",
    ok: !!serviceKey && serviceKey.length > 40,
    detail: serviceKey
      ? `presente (${serviceKey.length} chars)`
      : "AUSENTE: webhooks (Apple S2S) y cleanup admin fallarán",
  });
  checks.push({
    label: "NEXT_PUBLIC_SITE_URL",
    ok: !!siteUrl && siteUrl.startsWith("https://"),
    detail: siteUrl
      ? `${siteUrl}`
      : "AUSENTE: redirectTo OAuth puede usar localhost en serverless",
  });
  checks.push({
    label: "APPLE_CLIENT_ID",
    ok: !!appleClientId,
    detail: appleClientId
      ? `presente: ${appleClientId}`
      : "AUSENTE: webhook /api/auth/apple/notifications rechazará todo con invalid_signature",
  });

  // ── 2. Settings endpoint de Supabase ──────────────────────────
  // El endpoint /auth/v1/settings devuelve qué providers están activados.
  // Es público (con anon key) y sirve para saber sin loguearse si Apple
  // y Google están bien habilitados en Auth → Providers.
  if (supabaseUrl && anonKey) {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: anonKey },
        cache: "no-store",
      });
      if (!res.ok) {
        checks.push({
          label: "Supabase settings endpoint",
          ok: false,
          detail: `HTTP ${res.status} — comprueba que la URL y la anon key sean correctas`,
        });
      } else {
        const json = (await res.json()) as {
          external?: Record<string, boolean>;
          disable_signup?: boolean;
        };
        const googleEnabled = json.external?.google === true;
        const appleEnabled = json.external?.apple === true;
        const emailEnabled = json.external?.email !== false;

        checks.push({
          label: "Supabase provider: Email (magic link)",
          ok: emailEnabled,
          detail: emailEnabled
            ? "habilitado"
            : "DESHABILITADO en Auth → Providers — actívalo",
        });
        checks.push({
          label: "Supabase provider: Google",
          ok: googleEnabled,
          detail: googleEnabled
            ? "habilitado en Supabase Auth → Providers"
            : "DESHABILITADO: ir a Supabase Dashboard → Auth → Providers → Google → ON y pegar Client ID + Secret de Google Cloud",
        });
        checks.push({
          label: "Supabase provider: Apple",
          ok: appleEnabled,
          detail: appleEnabled
            ? "habilitado en Supabase Auth → Providers"
            : "DESHABILITADO: ir a Supabase Dashboard → Auth → Providers → Apple → ON y configurar Services ID + Team ID + Key ID + Private Key (.p8)",
        });
        checks.push({
          label: "Supabase disable_signup",
          ok: json.disable_signup !== true,
          detail:
            json.disable_signup === true
              ? "ACTIVADO: nuevos registros bloqueados. Auth → Settings → Allow new users."
              : "permite registros nuevos",
        });
      }
    } catch (err) {
      checks.push({
        label: "Supabase settings endpoint",
        ok: false,
        detail: `error de red: ${err instanceof Error ? err.message : "unknown"}`,
      });
    }
  }

  return checks;
}

const GOLD = "#c9a84c", GOLD2 = "#e8d48b", BG = "#000000", BG2 = "#0a0906";

export default async function AuthDebugPage() {
  // Protección en producción: solo accesible si se posee la cookie
  // de sesión de admin. En dev/local siempre permitido.
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    const cookieStore = cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    // El valor debe coincidir con un hash/admin token configurado.
    // Si no coincide, actuamos como si la página no existiera (404).
    const adminToken = process.env.ADMIN_DEBUG_TOKEN;
    const hasAdminAccess = adminSession && adminToken && adminSession === adminToken;
    if (!hasAdminAccess) {
      redirect("/login");
    }
  }

  const checks = await runChecks();
  const allOk = checks.every((c) => c.ok);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "(desconocido)";

  return (
    <main style={{ background: BG, minHeight: "100vh", color: "#e6decb", padding: "60px 20px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link href="/login" style={{ color: GOLD, fontSize: 13, textDecoration: "none", opacity: 0.7 }}>
          ← Volver a login
        </Link>

        <h1 style={{ color: GOLD2, fontSize: 36, fontWeight: 800, margin: "20px 0 8px", letterSpacing: "-0.02em" }}>
          Diagnóstico de Autenticación
        </h1>
        <p style={{ color: "#a69a82", fontSize: 14, marginBottom: 30 }}>
          Esta página no es indexable. Sirve para confirmar qué falla cuando los botones
          de Google / Apple devuelven error. No expone ningún secret.
        </p>

        <div
          style={{
            padding: "14px 18px",
            background: allOk ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${allOk ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
            borderRadius: 10,
            marginBottom: 28,
            color: allOk ? "#4ade80" : "#f87171",
            fontWeight: 600,
          }}
        >
          {allOk
            ? "✓ Todo en orden. Si aún falla, el problema está en Google Cloud o Apple Developer."
            : "⚠️ Hay configuración pendiente. Mira los detalles abajo."}
        </div>

        <div style={{ background: BG2, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          {checks.map((c, i) => (
            <div
              key={i}
              style={{
                padding: "14px 18px",
                borderBottom: i < checks.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: c.ok ? "#22c55e" : "#ef4444",
                  color: "#000",
                  fontSize: 13,
                  fontWeight: 800,
                  textAlign: "center",
                  lineHeight: "22px",
                }}
              >
                {c.ok ? "✓" : "×"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{c.label}</div>
                <div style={{ color: "#a69a82", fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
                  {c.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 32,
            padding: 22,
            background: BG2,
            border: "1px solid rgba(212,168,83,0.25)",
            borderRadius: 12,
          }}
        >
          <h2 style={{ color: GOLD2, fontSize: 18, fontWeight: 700, margin: "0 0 12px" }}>
            URLs que necesitas pegar en los providers
          </h2>
          <p style={{ fontSize: 13, color: "#a69a82", margin: "0 0 14px", lineHeight: 1.6 }}>
            Estas son las URLs exactas que el proveedor (Google / Apple / Supabase) necesita
            tener autorizadas para que el flujo funcione.
          </p>
          <UrlRow
            label="Site URL en Supabase Dashboard → Auth → URL Configuration"
            url="https://zonamundial.app"
          />
          <UrlRow
            label="Redirect URL en Supabase Dashboard → Auth → URL Configuration"
            url="https://zonamundial.app/auth/callback"
          />
          <UrlRow
            label="Authorized redirect URI en Google Cloud → OAuth 2.0 Client"
            url={`https://${projectRef}.supabase.co/auth/v1/callback`}
          />
          <UrlRow
            label="Return URL en Apple Developer → Services ID → SIWA Configure"
            url={`https://${projectRef}.supabase.co/auth/v1/callback`}
          />
          <UrlRow
            label="Server-to-Server Notification Endpoint en Apple Developer"
            url="https://zonamundial.app/api/auth/apple/notifications"
          />
        </div>
      </div>
    </main>
  );
}

function UrlRow({ label, url }: { label: string; url: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "#a69a82", marginBottom: 4 }}>{label}</div>
      <code
        style={{
          display: "block",
          padding: "8px 12px",
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          color: "#e8d48b",
          fontSize: 13,
          fontFamily: "ui-monospace, monospace",
          wordBreak: "break-all",
        }}
      >
        {url}
      </code>
    </div>
  );
}
