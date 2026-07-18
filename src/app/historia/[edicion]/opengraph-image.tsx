// src/app/historia/[edicion]/opengraph-image.tsx
// OG image dinámica 1200x630 por edición — generada en build / ISR

import { ImageResponse } from 'next/og';
import { getEdicionBySlug, getAllSlugs } from '@/lib/content/ediciones';

export const alt = 'Mundial — ZonaMundial';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export const dynamicParams = false;

export async function generateImageMetadata({
  params,
}: {
  params: { edicion: string };
}) {
  return [
    {
      id: params.edicion,
      alt: `Mundial ${params.edicion}`,
      contentType,
      size,
    },
  ];
}

export function generateStaticParams() {
  return getAllSlugs().map((edicion) => ({ edicion }));
}

export default async function OGImage({
  params,
}: {
  params: { edicion: string };
}) {
  const e = getEdicionBySlug(params.edicion);
  if (!e) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000000',
            color: '#c9a84c',
            fontSize: 64,
            fontWeight: 900,
          }}
        >
          ZonaMundial
        </div>
      ),
      size
    );
  }

  const champ = e.resultados?.campeon;
  const sub = e.resultados?.subcampeon;
  const sedeStr = e.sede.paises.map((p) => p.nombre).join(' / ');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #000000 0%, #14110a 60%, #0a0906 100%)',
          color: '#fff',
          padding: '64px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 8,
            color: '#c9a84c',
            marginBottom: 24,
            display: 'flex',
          }}
        >
          {`MUNDIAL · EDICIÓN ${e.meta.edicion}`}
        </div>

        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            lineHeight: 1,
            color: '#c9a84c',
            display: 'flex',
          }}
        >
          {e.meta.anio}
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#fff',
            marginTop: 8,
            display: 'flex',
          }}
        >
          {sedeStr}
        </div>

        {!e.proximo && champ && (
          <div
            style={{
              marginTop: 36,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 18,
                color: '#a69a82',
                letterSpacing: 4,
                fontWeight: 700,
                display: 'flex',
              }}
            >
              CAMPEÓN
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: '#fff',
                display: 'flex',
              }}
            >
              {`★ ${champ.pais}${sub ? ` · vs ${sub.pais}` : ''}`}
            </div>
          </div>
        )}

        {e.proximo && (
          <div
            style={{
              marginTop: 36,
              fontSize: 32,
              color: '#22C55E',
              fontWeight: 800,
              display: 'flex',
            }}
          >
            PRÓXIMA EDICIÓN
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid rgba(201,168,76,0.25)',
            paddingTop: 24,
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: '#a69a82',
              display: 'flex',
            }}
          >
            {`${e.formato.numEquipos} equipos · ${e.formato.numPartidos} partidos`}
            {!e.proximo ? ` · ${e.estadisticas.totalGoles} goles` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#fff',
                display: 'flex',
              }}
            >
              ZONA
            </span>
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#c9a84c',
                display: 'flex',
              }}
            >
              MUNDIAL
            </span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
