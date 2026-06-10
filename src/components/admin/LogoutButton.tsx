"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* da igual: la cookie se invalida igualmente al recargar */
    }
    window.location.href = "/admin/login";
  }
  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
    >
      {busy ? "Saliendo…" : "Cerrar sesión de admin"}
    </button>
  );
}
