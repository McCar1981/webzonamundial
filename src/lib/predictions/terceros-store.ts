// src/lib/predictions/terceros-store.ts
//
// Persistencia del pronóstico de "mejores terceros" por usuario. Clona el
// patrón de bracket-store.ts: lectura/escritura con el cliente de servidor
// (RLS: cada usuario solo ve/escribe su fila). Degrada a null/false si la tabla
// aún no existe (la migración 2026-41 la aplica Carlos en el SQL editor), para
// que el código pueda desplegarse ANTES que la migración sin romper la página.

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SavedTerceros {
  groups: string[];
  updated_at: string | null;
}

export async function getUserTerceros(uid: string): Promise<SavedTerceros | null> {
  const supa = createSupabaseServerClient();
  const { data, error } = await supa
    .from("prediction_terceros")
    .select("groups,updated_at")
    .eq("user_id", uid)
    .maybeSingle();
  // error = tabla aún no aplicada o sin permisos; data null = sin fila. En ambos
  // casos: el usuario no tiene pronóstico guardado todavía.
  if (error || !data) return null;
  const r = data as { groups: string[] | null; updated_at: string | null };
  return { groups: Array.isArray(r.groups) ? r.groups : [], updated_at: r.updated_at ?? null };
}

export async function saveUserTerceros(uid: string, groups: string[]): Promise<boolean> {
  const supa = createSupabaseServerClient();
  const { error } = await supa.from("prediction_terceros").upsert(
    {
      user_id: uid,
      groups,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  return !error;
}
