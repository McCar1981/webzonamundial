"use client";

import { useRef, useState, type CSSProperties } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

function clampZoom(z: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

const btnStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: "1px solid rgba(201,168,76,0.35)",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  fontSize: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export default function ComicViewer({ totalPages }: { totalPages: number }) {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const go = (delta: number) => {
    setPage((p) => Math.min(totalPages, Math.max(1, p + delta)));
    resetView();
  };

  const zoomBy = (delta: number) => {
    setZoom((z) => {
      const next = clampZoom(z + delta);
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "#000",
        overflow: "hidden",
        touchAction: "none",
        zIndex: 2000,
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "+" || e.key === "=") zoomBy(ZOOM_STEP);
        if (e.key === "-") zoomBy(-ZOOM_STEP);
        if (e.key === "0") resetView();
      }}
      onWheel={(e) => {
        e.preventDefault();
        zoomBy(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
      }}
      onPointerDown={(e) => {
        if (zoom === MIN_ZOOM) return;
        dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        setDragging(true);
      }}
      onPointerMove={(e) => {
        if (!dragRef.current) return;
        const { x, y, ox, oy } = dragRef.current;
        setOffset({ x: ox + (e.clientX - x), y: oy + (e.clientY - y) });
      }}
      onPointerUp={() => {
        dragRef.current = null;
        setDragging(false);
      }}
      onPointerLeave={() => {
        dragRef.current = null;
        setDragging(false);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/comic-preview/${page}.jpg`}
        alt={`Página ${page}`}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          maxWidth: "100vw",
          maxHeight: "100vh",
          userSelect: "none",
          cursor: zoom > MIN_ZOOM ? (dragging ? "grabbing" : "grab") : "default",
          transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transition: dragging ? "none" : "transform 0.2s ease",
        }}
        draggable={false}
      />

      {/* Zonas de click para pasar página — solo sin zoom, para no chocar con el arrastre */}
      {zoom === MIN_ZOOM && (
        <>
          <div onClick={() => go(-1)} style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "35%" }} />
          <div onClick={() => go(1)} style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "35%" }} />
        </>
      )}

      {/* Flechas prev/next visibles */}
      <button
        onClick={() => go(-1)}
        disabled={page <= 1}
        style={{ ...btnStyle, position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", opacity: page <= 1 ? 0.3 : 1 }}
        aria-label="Página anterior"
      >
        ‹
      </button>
      <button
        onClick={() => go(1)}
        disabled={page >= totalPages}
        style={{ ...btnStyle, position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", opacity: page >= totalPages ? 0.3 : 1 }}
        aria-label="Página siguiente"
      >
        ›
      </button>

      {/* Controles de zoom */}
      <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
        <button onClick={() => zoomBy(-ZOOM_STEP)} disabled={zoom <= MIN_ZOOM} style={{ ...btnStyle, opacity: zoom <= MIN_ZOOM ? 0.3 : 1 }} aria-label="Alejar">
          −
        </button>
        <button onClick={resetView} style={{ ...btnStyle, width: "auto", padding: "0 12px", borderRadius: 20, fontSize: 13, fontWeight: 700 }} aria-label="Restablecer zoom">
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={() => zoomBy(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM} style={{ ...btnStyle, opacity: zoom >= MAX_ZOOM ? 0.3 : 1 }} aria-label="Acercar">
          +
        </button>
      </div>

      {/* Contador de página */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          font: "600 14px system-ui, sans-serif",
          padding: "6px 14px",
          borderRadius: 999,
          border: "1px solid rgba(201,168,76,0.3)",
        }}
      >
        {page} / {totalPages}
      </div>
    </div>
  );
}
