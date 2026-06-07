"use client";

// Botón "salir" del banner de contexto de bar: borra la cookie zm_bar y refresca
// para volver a la experiencia ZonaMundial sin marca de bar. No cierra la sesión
// ni saca de la porra; solo deja de mostrar el banner del bar.

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function BarContextExit({ color }: { color: string }) {
  const router = useRouter();

  function exit() {
    document.cookie = "zm_bar=; path=/; max-age=0; SameSite=Lax";
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={exit}
      aria-label="Salir del contexto del bar"
      title="Salir del contexto del bar"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color,
        display: "inline-flex",
        alignItems: "center",
        padding: 4,
        flexShrink: 0,
      }}
    >
      <X size={16} />
    </button>
  );
}
