"use client";

// "Ponme al día": muestra el resumen del partido generado por IA (endpoint
// cacheado /api/ligas/match-summary). Badge "IA" cuando el texto viene del modelo
// (si cae al determinista, sin badge). Carga en cliente para no bloquear el render
// de la página. Sin emojis.

import { useEffect, useState } from "react";

const GOLD = "#c9a84c";

export default function MatchSummary({ fixtureId }: { fixtureId: number }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [ai, setAi] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`/api/ligas/match-summary?fixtureId=${fixtureId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        if (j?.summary) {
          setSummary(j.summary);
          setAi(!!j.ai);
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [fixtureId]);

  if (!loading && !summary) return null;

  return (
    <section style={{ marginTop: 22, padding: 16, borderRadius: 14, background: "linear-gradient(135deg, rgba(201,168,76,0.10), rgba(201,168,76,0.02))", border: "1px solid rgba(201,168,76,0.3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>Ponme al día</span>
        {ai && (
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: "#0a0906", background: `linear-gradient(135deg, ${GOLD}, #e8d48b)`, padding: "2px 7px", borderRadius: 99 }}>IA</span>
        )}
      </div>
      {loading ? (
        <div style={{ height: 14, width: "80%", borderRadius: 6, background: "rgba(255,255,255,0.06)" }} aria-label="Cargando resumen" />
      ) : (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#dbe4f0" }}>{summary}</p>
      )}
    </section>
  );
}
