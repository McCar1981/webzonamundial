// src/app/b/[barSlug]/unirse/page.tsx
//
// Alta LIGERA en la porra de un bar. Es la pantalla a la que llega el cliente
// del bar cuando, tras escanear el QR, pulsa "Entrar en la porra" sin tener
// sesión. En vez del /login genérico de ZM ("Iniciar sesión"), ve una pantalla
// con la identidad del bar: "Únete a la peña de {bar}".
//
// La "trampa": el alta crea igualmente una cuenta de ZonaMundial (Supabase la
// genera con el enlace mágico / OAuth), pero como el destino es /b/..., el
// handler auth/callback marca onboarded_at automáticamente y se salta los pasos
// largos del onboarding. Al volver autenticado, JoinButton completa la unión.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { getBarBySlug } from "@/lib/bars/store";
import { getTheme } from "@/lib/bars/themes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import JoinForm from "./JoinForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Únete a la porra · ZonaMundial",
  robots: { index: false, follow: false },
};

export default async function BarJoinPage({
  params, searchParams,
}: { params: { barSlug: string }; searchParams: { qr?: string } }) {
  const bar = await getBarBySlug(params.barSlug);
  if (!bar) notFound();

  // Si ya tiene sesión, no necesita registrarse: lo mandamos a la página del
  // bar con intención de unirse para que JoinButton complete la unión.
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const params2 = new URLSearchParams();
    if (searchParams.qr) params2.set("qr", searchParams.qr);
    params2.set("join", "1");
    redirect(`/b/${bar.slug}?${params2.toString()}`);
  }

  const t = getTheme(bar.theme_id);

  return (
    <main
      style={{
        background: t.bg, color: t.text, minHeight: "100vh",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: "48px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Cabecera bar */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 76, height: 76, borderRadius: 18, margin: "0 auto 16px",
              border: `3px solid ${t.primary}`,
              background: bar.logo_url ? `center/cover url(${bar.logo_url})` : t.surface,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 34, color: t.primary,
            }}
          >
            {!bar.logo_url && bar.name.charAt(0).toUpperCase()}
          </div>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, color: t.primary,
              fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8,
            }}
          >
            <Trophy size={15} /> Peña Mundialista 2026
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.15, margin: 0 }}>
            Únete a la porra de {bar.name}
          </h1>
          <p style={{ fontSize: 15, color: t.textMuted, marginTop: 10, lineHeight: 1.5 }}>
            Crea tu acceso en segundos y empieza a predecir los partidos del Mundial.
          </p>
        </div>

        {/* Card formulario */}
        <div
          style={{
            background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.cardRadius,
            padding: "28px 24px",
          }}
        >
          <JoinForm
            slug={bar.slug}
            qr={searchParams.qr}
            theme={{
              primary: t.primary, primaryInk: t.primaryInk, surface: t.surface2,
              border: t.border, text: t.text, textMuted: t.textMuted, cardRadius: t.cardRadius,
            }}
          />
        </div>

        {/* Pie */}
        <p style={{ textAlign: "center", fontSize: 12, color: t.textMuted, marginTop: 20, lineHeight: 1.5 }}>
          Powered by <span style={{ color: t.secondary, fontWeight: 800 }}>ZonaMundial</span>.
          Tu cuenta te sirve para jugar en {bar.name} y en toda la plataforma.
        </p>
      </div>
    </main>
  );
}
