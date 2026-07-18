"use client";

import { useSearchParams } from "next/navigation";

export default function PurchaseSuccessBanner() {
  const searchParams = useSearchParams();
  const purchase = searchParams.get("purchase");
  if (purchase !== "success") return null;
  return (
    <div
      className="px-5 py-4 rounded-xl mb-6 text-sm flex items-start gap-3"
      style={{
        background: "linear-gradient(90deg, rgba(201,168,76,0.18), rgba(201,168,76,0.04))",
        border: "1px solid rgba(201,168,76,0.45)",
        color: "#FDE68A",
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>🎉</span>
      <div>
        <strong className="block text-white">¡Bienvenido al equipo Founders!</strong>
        <span className="text-[#e6decb]">
          Tu pago se ha procesado correctamente. Si no ves los detalles aquí abajo todavía, dale unos segundos y refresca la página — Stripe nos confirma el pago en cuestión de segundos.
        </span>
      </div>
    </div>
  );
}
