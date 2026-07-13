"use client";

import { useState } from "react";

export default function ComicViewer({ totalPages }: { totalPages: number }) {
  const [page, setPage] = useState(1);
  const [touchX, setTouchX] = useState<number | null>(null);

  const go = (delta: number) => {
    setPage((p) => Math.min(totalPages, Math.max(1, p + delta)));
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        setTouchX(null);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/comic-preview/${page}.jpg`}
        alt={`Página ${page}`}
        style={{ maxWidth: "100%", maxHeight: "100%", userSelect: "none" }}
        draggable={false}
      />
      <div
        onClick={() => go(-1)}
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "50%", cursor: "pointer" }}
      />
      <div
        onClick={() => go(1)}
        style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "50%", cursor: "pointer" }}
      />
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
