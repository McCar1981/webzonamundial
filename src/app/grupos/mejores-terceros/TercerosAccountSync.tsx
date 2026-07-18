"use client";

// src/app/grupos/mejores-terceros/TercerosAccountSync.tsx
//
// Cierra el bucle de conversión del mini-juego TercerosPicker: cuando un usuario
// YA REGISTRADO visita la landing con un pronóstico en localStorage, lo sube a
// su cuenta automáticamente (PUT /api/predictions/terceros). Clona el patrón de
// BracketAccountSync:
//   - Detecta sesión con un GET al endpoint (401 anónimo / 200 logueado).
//   - Solo dispara la llamada si hay algo que guardar -> coste CERO para los
//     visitantes anónimos (la inmensa mayoría del tráfico de esta página).
//   - No borra localStorage (sincroniza, no traslada): el picker sigue intacto.
//   - Una vez por sesión (flag en sessionStorage) para no re-escribir en cada
//     navegación.
// Si la tabla aún no existe (migración 2026-41 pendiente de aplicar), el PUT
// devuelve error y no mostramos nada: la página sigue intacta.

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";

const STORAGE_KEY = "zm:pronostico-terceros:v1";
const SESSION_FLAG = "zm:terceros-synced";
const VALID = new Set(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]);
const TARGET = 8;
const GREEN = "#22c55e", MID = "#a69a82";

function readLocal(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    const seen = new Set<string>();
    const groups: string[] = [];
    for (const x of arr) {
      if (typeof x === "string" && VALID.has(x) && !seen.has(x)) {
        seen.add(x);
        groups.push(x);
        if (groups.length >= TARGET) break;
      }
    }
    return groups.length ? groups : null;
  } catch {
    return null;
  }
}

export default function TercerosAccountSync() {
  const [status, setStatus] = useState<"idle" | "syncing" | "done">("idle");

  const sync = useCallback(async () => {
    const groups = readLocal();
    if (!groups) return; // nada que guardar: no molestamos al servidor (anónimos sin jugar)
    try {
      if (sessionStorage.getItem(SESSION_FLAG)) return; // ya sincronizado esta sesión
    } catch {
      /* sin sessionStorage: seguimos */
    }

    // ¿Logueado? El GET devuelve 401 a anónimos (que ya ven el CTA del picker).
    let authed = false;
    try {
      const res = await fetch("/api/predictions/terceros", { method: "GET" });
      authed = res.ok;
    } catch {
      return;
    }
    if (!authed) return;

    setStatus("syncing");
    try {
      const res = await fetch("/api/predictions/terceros", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups }),
      });
      if (res.ok) {
        try {
          sessionStorage.setItem(SESSION_FLAG, "1");
        } catch {
          /* ignore */
        }
        setStatus("done");
      } else {
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    void sync();
  }, [sync]);

  if (status === "idle") return null;

  return (
    <p
      role="status"
      style={{
        margin: "12px 2px 0",
        fontSize: 13.5,
        fontWeight: 700,
        color: status === "done" ? GREEN : MID,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {status === "done" ? (
        <>
          <Check size={15} strokeWidth={3} aria-hidden /> Pronóstico guardado en tu cuenta
        </>
      ) : (
        "Guardando tu pronóstico…"
      )}
    </p>
  );
}
