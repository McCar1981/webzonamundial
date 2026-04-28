"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export default function AvatarUploader({
  userId,
  initialUrl,
  username,
}: {
  userId: string;
  initialUrl: string | null;
  username: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  const supabase = createSupabaseBrowserClient();

  const initial = (username || "?").charAt(0).toUpperCase();

  function handlePick() {
    inputRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (!ALLOWED.includes(file.type)) {
      setError("Formato no soportado. Usa JPG, PNG o WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Archivo demasiado grande. Máximo 2 MB.");
      return;
    }

    setUploading(true);

    // Path determinado: <userId>/avatar.<ext>
    // El path inicia con el userId — coincide con la RLS policy que
    // solo deja escribir si la primera carpeta es auth.uid().
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      setError("Error subiendo la imagen. Inténtalo de nuevo.");
      setUploading(false);
      return;
    }

    // Public URL — añadimos timestamp para romper cache del browser
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const cacheBusted = `${pub.publicUrl}?v=${Date.now()}`;

    // Update profile.avatar_url
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: cacheBusted })
      .eq("id", userId);

    if (updateError) {
      setError("Imagen subida pero no pude actualizar el perfil.");
      setUploading(false);
      return;
    }

    setPreview(cacheBusted);
    setUploading(false);
    router.refresh(); // refresca header (avatar nuevo en menú)
  }

  async function handleRemove() {
    setError("");
    setRemoving(true);

    // Borrar todos los archivos del usuario en /avatars/{userId}/
    const { data: list } = await supabase.storage
      .from("avatars")
      .list(userId);

    if (list && list.length > 0) {
      const paths = list.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from("avatars").remove(paths);
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);

    if (updateError) {
      setError("Error eliminando avatar.");
      setRemoving(false);
      return;
    }

    setPreview(null);
    setRemoving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div
          className="w-32 h-32 rounded-full border-2 border-[#C9A84C]/30 flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{
            background: preview
              ? `url(${preview}) center/cover no-repeat`
              : "linear-gradient(135deg, #C9A84C, #E8D48B)",
            color: "#030712",
          }}
        >
          {!preview && (
            <span className="text-5xl font-black">{initial}</span>
          )}
        </div>

        <div className="flex-1 space-y-3 w-full">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={handlePick}
            disabled={uploading || removing}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-[#030712] font-bold text-sm disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
          >
            {uploading ? "Subiendo…" : preview ? "Cambiar foto" : "Subir foto"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading || removing}
              className="w-full sm:w-auto sm:ml-3 px-6 py-3 rounded-xl text-red-400 font-semibold text-sm border border-red-500/30 hover:bg-red-500/10 transition-all disabled:opacity-50"
            >
              {removing ? "Eliminando…" : "Eliminar"}
            </button>
          )}
          <p className="text-xs text-gray-500">
            Recomendado: foto cuadrada, mínimo 200×200 px.
          </p>
        </div>
      </div>
    </div>
  );
}
