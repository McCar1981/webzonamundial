// src/components/ia-coach/useCoachIdentity.ts
//
// Hook client-side del IA Coach: resuelve el NOMBRE DE REGISTRO del usuario
// logueado (profiles.username) para que el widget pueda saludarlo por su nombre.
//
// Se usa solo a nivel de PRESENTACIÓN (cabecera del widget, intros de los
// paneles). El saludo dentro del prompt del Retador (Debate) NO depende de esto:
// ese se resuelve server-side desde la sesión, que no se puede falsear.
//
// Degrada con elegancia: si Supabase no está configurado o no hay sesión,
// devuelve name=null y el widget muestra el texto genérico de siempre.

"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface CoachIdentity {
  /** Nombre de registro del usuario, o null si anónimo / sin onboarding. */
  name: string | null;
  /** true cuando ya se intentó resolver la identidad (evita parpadeos). */
  ready: boolean;
}

export function useCoachIdentity(): CoachIdentity {
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const supabase = (() => {
      try {
        return createSupabaseBrowserClient();
      } catch {
        return null;
      }
    })();

    if (!supabase) {
      setReady(true);
      return;
    }

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!active) return;
        if (!user) {
          setReady(true);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();
        if (!active) return;
        const raw = (profile as { username?: string | null } | null)?.username ?? null;
        setName(typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null);
      } catch {
        /* degrada: saludo genérico */
      } finally {
        if (active) setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return { name, ready };
}
