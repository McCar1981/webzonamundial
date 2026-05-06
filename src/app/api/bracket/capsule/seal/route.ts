// POST /api/bracket/capsule/seal
// Sella la cápsula del tiempo del bracket del usuario.
// Body: { email, picks, champion }
//
// Reglas:
//  - Si Date.now() >= CAPSULE_DEADLINE (11 jun 2026) → 410 Gone.
//  - Si ese email ya selló una → 409 Conflict.
//  - Si todo OK → 201 Created con { hash }.

import { NextRequest, NextResponse } from "next/server";
import { sealCapsule, isWithinSealWindow } from "@/lib/bracket/timecapsule";
import { sendEmail, brandedEmail, escapeHtml } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  email?: string;
  picks?: Record<string, unknown>;
  champion?: string | null;
}

export async function POST(request: NextRequest) {
  if (!isWithinSealWindow()) {
    return NextResponse.json(
      { error: "El plazo para sellar cápsulas terminó el 11 de junio de 2026." },
      { status: 410 }
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const picks = body.picks;
  const champion = body.champion ?? null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email no válido" }, { status: 400 });
  }
  if (!picks || typeof picks !== "object") {
    return NextResponse.json({ error: "Faltan predicciones" }, { status: 400 });
  }
  if (Object.keys(picks).length < 50) {
    return NextResponse.json(
      { error: "Tu bracket está incompleto. Predice al menos las fases de grupos antes de sellar." },
      { status: 400 }
    );
  }

  const result = await sealCapsule({
    email,
    picks: picks as Record<string, import("@/lib/bracket/types").Pick>,
    champion,
  });

  if (result.ok === false) {
    if (result.error === "already_sealed") {
      return NextResponse.json(
        { error: "Ya tienes una cápsula sellada con este email." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Confirmación por email (no bloqueante)
  void sendEmail({
    to: email,
    subject: "🔒 Tu cápsula del Mundial 2026 está sellada",
    html: brandedEmail({
      preheader: "Te enviaremos un email con tus aciertos cuando termine el Mundial el 19 de julio de 2026.",
      heading: "🔒 Cápsula sellada",
      bodyHtml: `
        <p>Tu cápsula del bracket Mundial 2026 ha sido <strong>sellada con éxito</strong>.</p>
        <p>Hemos guardado todas tus predicciones tal como están ahora mismo. <strong>El 20 de julio de 2026</strong>, justo después de la final, te enviaremos un email con tus aciertos: cuántos partidos clavaste, si acertaste al campeón y dónde fallaste.</p>
        <p>No podrás modificar tus predicciones a partir de ahora. Esto es lo que tiene una cápsula del tiempo: se sella y se respeta.</p>
        <p style="color:#6b7280;font-size:13px;">ID de tu cápsula: <code>${escapeHtml(result.hash)}</code></p>
      `,
      ctaLabel: "Ver mi bracket",
      ctaHref: "https://zonamundial.app/bracket",
    }),
  });

  return NextResponse.json(
    { ok: true, hash: result.hash, sealedAt: new Date().toISOString() },
    { status: 201 }
  );
}
