export function AdSpace({ position }: { position: 1 | 2 }) {
  const subject = encodeURIComponent(
    `Publicidad en ZonaMundial - Espacio Banner ${position}`
  );
  const body = encodeURIComponent(
    `Hola equipo de ZonaMundial,\n\nMe interesa contratar un espacio publicitario en vuestra web (Banner Home ${position}).\n\nEmpresa: \nContacto: \nPresupuesto estimado: \n\nQuedo a la espera de vuestra propuesta.\n\nGracias.`
  );

  return (
    <div className="w-full border-y border-white/5 py-8 sm:py-10 relative" style={{ background: "#07101C" }}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <a
          href={`mailto:info@sprintmarkt.com?subject=${subject}&body=${body}`}
          className="inline-block px-8 py-4 rounded-2xl border border-dashed border-[#C9A84C]/30 bg-[#C9A84C]/5 hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/50 transition-all duration-300 group"
        >
          <p className="text-[#C9A84C]/60 text-sm font-bold tracking-widest uppercase mb-2 group-hover:text-[#C9A84C]/80">
            Espacio disponible para publicidad
          </p>
          <p className="text-gray-400 text-sm group-hover:text-gray-300">Contacta con nosotros → info@sprintmarkt.com</p>
        </a>
      </div>
    </div>
  );
}
