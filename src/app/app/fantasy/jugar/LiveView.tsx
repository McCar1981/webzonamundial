"use client";

export default function LiveView({ team }: { team: unknown }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-lg font-semibold">En Vivo — Próximamente</p>
      <p className="text-sm mt-2">El seguimiento en vivo estará disponible durante el Mundial.</p>
    </div>
  );
}
