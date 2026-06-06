"use client";

// Refresca la pantalla TV cada N segundos para mantener ranking y contador al día.
import { useEffect } from "react";

export default function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  useEffect(() => {
    const id = setInterval(() => window.location.reload(), seconds * 1000);
    return () => clearInterval(id);
  }, [seconds]);
  return null;
}
