"use client";

import { useState } from "react";

interface Result {
  ok: boolean;
  dryRun?: boolean;
  total?: number;
  sample?: string[];
  sent?: number;
  failed?: number;
  count?: number;
  error?: string;
}

export default function NewsletterComposer() {
  const [subject, setSubject] = useState("");
  const [heading, setHeading] = useState("");
  const [preheader, setPreheader] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p>Hola,</p>\n<p>Aquí va el contenido del email.</p>");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [kind, setKind] = useState<"all" | "full" | "waitlist" | "usuarios">("all");
  const [limit, setLimit] = useState<string>("");
  const [loading, setLoading] = useState<"idle" | "dry" | "send">("idle");
  const [result, setResult] = useState<Result | null>(null);

  async function send(dryRun: boolean) {
    setLoading(dryRun ? "dry" : "send");
    setResult(null);
    try {
      const r = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          heading: heading || subject,
          preheader: preheader || undefined,
          html: bodyHtml,
          ctaLabel: ctaLabel || undefined,
          ctaHref: ctaHref || undefined,
          kind,
          limit: limit ? Number(limit) : undefined,
          dryRun,
        }),
      });
      const data = await r.json();
      setResult(r.ok ? data : { ok: false, error: data.error || `HTTP ${r.status}` });
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message });
    } finally {
      setLoading("idle");
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Subject (asunto del email)">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
          placeholder="🏆 Novedad de ZonaMundial: lo que viene esta semana"
        />
      </Field>

      <Field label="Heading (título dentro del email — opcional, defaults al subject)">
        <input
          type="text"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
        />
      </Field>

      <Field label="Preheader (preview en bandeja de entrada — opcional)">
        <input
          type="text"
          value={preheader}
          onChange={(e) => setPreheader(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
          placeholder="Lectura corta sobre la novedad de la semana en ZonaMundial"
        />
      </Field>

      <Field label="HTML del cuerpo (admite <p>, <a>, <ul>, <strong>)">
        <textarea
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="CTA label (opcional)">
          <input
            type="text"
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
            placeholder="Leer en el blog"
          />
        </Field>
        <Field label="CTA URL (opcional)">
          <input
            type="text"
            value={ctaHref}
            onChange={(e) => setCtaHref(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
            placeholder="https://zonamundial.app/blog/..."
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Filtro de destinatarios">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            <option value="usuarios">Todos los usuarios (cuentas Supabase)</option>
            <option value="all">Registros + usuarios (máxima cobertura)</option>
            <option value="full">Solo registros completos (KV)</option>
            <option value="waitlist">Solo lista de espera (KV)</option>
          </select>
        </Field>
        <Field label="Limit (vacío = sin límite)">
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
            placeholder="ej: 50 (para prueba)"
          />
        </Field>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => send(true)}
          disabled={loading !== "idle" || !subject || !bodyHtml}
          className="px-5 py-3 rounded-full text-sm font-bold border border-white/15 text-white bg-white/5 disabled:opacity-50"
        >
          {loading === "dry" ? "Calculando…" : "Dry-run (ver destinatarios)"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!confirm("¿Enviar de verdad? No se puede cancelar tras este punto.")) return;
            send(false);
          }}
          disabled={loading !== "idle" || !subject || !bodyHtml}
          className="px-5 py-3 rounded-full text-sm font-bold text-[#1A1208] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#C9A84C,#FDE68A)" }}
        >
          {loading === "send" ? "Enviando…" : "Enviar"}
        </button>
      </div>

      {result && (
        <div
          className="mt-4 p-5 rounded-xl text-sm"
          style={{
            background: result.ok
              ? "linear-gradient(90deg, rgba(16,185,129,0.10), rgba(16,185,129,0.02))"
              : "linear-gradient(90deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))",
            border: `1px solid ${result.ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
            color: result.ok ? "#6ee7b7" : "#fca5a5",
          }}
        >
          {result.ok ? (
            result.dryRun ? (
              <>
                <b>Dry-run completado.</b>
                <br />
                Se enviaría a <b>{result.count}</b> destinatarios.
                {result.sample && result.sample.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs opacity-70">Ver primeros 10</summary>
                    <pre className="mt-2 text-[11px] opacity-80 whitespace-pre-wrap">
                      {result.sample.join("\n")}
                    </pre>
                  </details>
                )}
              </>
            ) : (
              <>
                <b>Envío completado.</b>
                <br />
                Total: {result.total} · Enviados OK: <b>{result.sent}</b> · Fallidos: {result.failed}
              </>
            )
          ) : (
            <>
              <b>Error:</b> {result.error}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block font-mono uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
