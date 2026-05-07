// POST /api/notify-module/[slug]
// Body: { email: string }
//
// Marca al usuario como interesado en un módulo concreto. Devuelve count
// actualizado para que el cliente pueda mostrar "X personas ya esperan".
//
// Rate-limit: 5 requests/minuto por (email|ip).

import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {
  addModuleInterest,
  getModuleCount,
  isValidModuleSlug,
} from "@/lib/module-interest/store";
import { sendEmail, brandedEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_WINDOW_SEC = 60;
const RATE_MAX = 5;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function rateLimited(email: string, ip: string): Promise<boolean> {
  const key = `modint:ratelimit:${email}:${ip}`;
  const count = await kv.incr(key);
  if (count === 1) await kv.expire(key, RATE_WINDOW_SEC);
  return count > RATE_MAX;
}

const MODULE_LABELS: Record<string, string> = {
  predicciones: "Predicciones",
  fantasy: "Fantasy Mundial",
  "ia-coach": "IA Coach",
  trivia: "Trivia Mundial",
  matchcenter: "Match Center",
  ligas: "Ligas Privadas",
  rankings: "Rankings",
  streaming: "Streaming + Creators",
  album: "Álbum Digital",
  chat: "Chat y Comunidad",
  micro: "Micro-publicaciones",
  "modo-carrera": "Modo Carrera",
  stories: "Stories",
};

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!isValidModuleSlug(slug)) {
    return NextResponse.json({ error: "Módulo no válido" }, { status: 400 });
  }

  let body: { email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email no válido" }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (await rateLimited(email, ip)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un minuto." },
      { status: 429 }
    );
  }

  const result = await addModuleInterest({
    email,
    module: slug,
    source: body.source,
    ip,
  });

  const total = await getModuleCount(slug);
  const moduleLabel = MODULE_LABELS[slug] || slug;

  // Solo enviamos email de confirmación si es nuevo en ESTE módulo
  if (result.isNewForModule) {
    void sendEmail({
      to: email,
      subject: `🔔 Te avisaremos cuando lance ${moduleLabel}`,
      html: brandedEmail({
        preheader: `Estás en la lista de espera de ${moduleLabel}.`,
        heading: `Estás en la lista 🔔`,
        bodyHtml: `
          <p>Te avisaremos por email <strong>en cuanto activemos ${moduleLabel}</strong> en la app de ZonaMundial.</p>
          <p>Mientras tanto, puedes apuntarte a otros módulos en <a href="https://zonamundial.app/la-app">zonamundial.app/la-app</a> y reservar tu sitio en lo que más te interese.</p>
          <p style="color:#6b7280;font-size:13px;">Si ves un Founders Pass disponible y quieres apoyar el proyecto, tendrás acceso prioritario a todas las funcionalidades en cuanto se activen.</p>
        `,
        ctaLabel: "Ver toda la app",
        ctaHref: "https://zonamundial.app/la-app",
      }),
    });
  }

  return NextResponse.json({
    ok: true,
    isNewForModule: result.isNewForModule,
    isNewUser: result.isNewUser,
    moduleSlug: slug,
    moduleLabel,
    total,
  });
}

/** GET para que el contador público pueda hacer fetch sin POST. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!isValidModuleSlug(slug)) {
    return NextResponse.json({ error: "Módulo no válido" }, { status: 400 });
  }
  const total = await getModuleCount(slug);
  return NextResponse.json({ slug, total });
}
