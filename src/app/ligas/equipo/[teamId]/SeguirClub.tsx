"use client";

// Botón "Hacer mi club" de la página de equipo: fija este club como el favorito
// del usuario (POST /api/ligas/mi-club). Si ya lo es, lo dice. Anónimo: lleva a
// registro conservando la intención de volver a este equipo.

import { useCallback, useEffect, useState } from "react";

const GOLD = "#c9a84c";
const DIM = "#9db0c9";

export default function SeguirClub({ teamId, teamName, teamLogo }: { teamId: number; teamName: string; teamLogo: string | null }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [esMiClub, setEsMiClub] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ligas/mi-club")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) { setAuthed(false); return; }
        setAuthed(!!j.authed);
        setEsMiClub(!!j.club && j.club.clubId === teamId);
      })
      .catch(() => setAuthed(false));
  }, [teamId]);

  const seguir = useCallback(async () => {
    if (busy || esMiClub) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/ligas/mi-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, teamName, teamLogo }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setEsMiClub(true);
      else if (j?.error === "not_available") setError("Disponible en breve.");
      else setError("No se pudo guardar.");
    } catch {
      setError("Sin conexión.");
    } finally {
      setBusy(false);
    }
  }, [busy, esMiClub, teamId, teamName, teamLogo]);

  if (authed === null) return null;
  if (!authed) {
    return (
      <a href={`/registro?next=/ligas/equipo/${teamId}`} style={{ flexShrink: 0, fontSize: 12.5, color: GOLD, textDecoration: "none", border: `1px solid rgba(201,168,76,0.4)`, borderRadius: 99, padding: "7px 13px" }}>
        Hacer mi club
      </a>
    );
  }
  if (esMiClub) {
    return <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: GOLD, border: "1px solid rgba(201,168,76,0.4)", borderRadius: 99, padding: "7px 13px", background: "rgba(201,168,76,0.1)" }}>Tu club</span>;
  }
  return (
    <span style={{ flexShrink: 0, display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button onClick={seguir} disabled={busy}
        style={{ border: "none", cursor: busy ? "default" : "pointer", background: `linear-gradient(135deg, ${GOLD}, #e8d48b)`, color: "#0A1422", fontWeight: 600, fontSize: 12.5, padding: "8px 14px", borderRadius: 99, opacity: busy ? 0.7 : 1 }}>
        {busy ? "…" : "Hacer mi club"}
      </button>
      {error ? <span style={{ fontSize: 11, color: DIM }}>{error}</span> : null}
    </span>
  );
}
