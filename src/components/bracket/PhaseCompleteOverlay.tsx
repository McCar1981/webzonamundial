// src/components/bracket/PhaseCompleteOverlay.tsx
// Overlay efímero (~1.8s) cuando el usuario completa una fase entera.

"use client";

import { useEffect, useState } from "react";
import styles from "./bracket.module.css";

interface Props {
  trigger: { title: string; sub: string } | null;
  onClear: () => void;
}

export default function PhaseCompleteOverlay({ trigger, onClear }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setShow(true);
    const t = setTimeout(() => {
      setShow(false);
      // limpiar después de la transición de salida
      const t2 = setTimeout(onClear, 350);
      return () => clearTimeout(t2);
    }, 1800);
    return () => clearTimeout(t);
  }, [trigger, onClear]);

  if (!trigger) return null;

  return (
    <div className={styles.phaseComplete} data-show={show}>
      <div className={styles.phaseCompleteInner}>
        <div className={styles.phaseCompleteEyebrow}>// FASE COMPLETADA</div>
        <div className={styles.phaseCompleteTitle}>{trigger.title}</div>
        <div className={styles.phaseCompleteSub}>{trigger.sub}</div>
      </div>
    </div>
  );
}
