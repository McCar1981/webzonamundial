"use client";

// Avatar de jugador de Zona de Ligas: la foto real de api-football derivada de su
// id de plantilla (https://media.api-sports.io/football/players/{id}.png). CDN
// estático → 0 cuota, ya licenciado en el plan; <img> plano (el CSP img-src https:
// ya lo permite, sin tocar next.config). Si un jugador puntual no tiene foto, se
// oculta en vez de mostrar un icono roto. Reutilizable en fantasy, ficha de club,
// alineaciones, etc.

export default function PlayerAvatar({ id, size = 28 }: { id: number; size?: number }) {
  if (!id) return null;
  return (
    <img
      src={`https://media.api-sports.io/football/players/${id}.png`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        background: "#241e12",
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    />
  );
}
