// CalendarBanner — banner del home invitando a añadir el Mundial al calendario.
// Compacto pero llamativo: gradiente dorado + icono de calendario + CTA.

"use client";

import CalendarExportButton from "@/components/CalendarExportButton";

export function CalendarBanner() {
  return (
    <section className="relative px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-10"
          style={{
            borderColor: "rgba(201,168,76,0.25)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(11,24,37,0.85))",
          }}
        >
          {/* Glow dorado decorativo */}
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(201,168,76,0.25), transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div
            aria-hidden
            className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(117,170,219,0.18), transparent 70%)",
              filter: "blur(50px)",
            }}
          />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.25em] mb-3">
                📅 Nuevo · BIBLIA Calendar
              </div>
              <h2
                className="font-black text-white mb-3 leading-tight"
                style={{
                  fontSize: "clamp(22px, 3.6vw, 36px)",
                  letterSpacing: "-0.02em",
                }}
              >
                Llévate el{" "}
                <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
                  Mundial 2026
                </span>{" "}
                a tu calendario
              </h2>
              <p className="text-sm text-[#cbd5e1] leading-relaxed max-w-2xl">
                104 partidos, 16 sedes, recordatorios automáticos antes del
                kickoff, link al estadio y hasta el himno de cada selección en
                Spotify. Apple, Google y Outlook. Se actualiza solo cuando
                cambian fechas.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#94a3b8]">
                <span>⏰ Recordatorios 24h / 2h / 15min</span>
                <span>📍 Mapas integrados</span>
                <span>🎵 Himnos en Spotify</span>
                <span>🔄 Actualización automática</span>
              </div>
            </div>
            <div className="flex md:justify-end">
              <CalendarExportButton
                variant="panel"
                label="Añadir a mi calendario"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
