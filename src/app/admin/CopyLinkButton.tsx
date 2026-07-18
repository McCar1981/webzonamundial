"use client";

import { useState } from "react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso: seleccionable a mano en el input contiguo.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-[#000000] transition-all"
      style={{ background: copied ? "#10B981" : "linear-gradient(135deg, #C9A84C, #A8893D)" }}
    >
      {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}
