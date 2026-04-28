"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/*
  AvatarUploader

  Cliente del endpoint server-side /api/account/avatar.
  No habla con Supabase Storage directamente — el backoffice valida y
  sube con service_role para evitar problemas de RLS dependientes del
  flujo de auth (Google primer login a veces fallaba el JWT).

  Validación:
    - MIME y size en cliente (UX rápida)
    - Mismo check en server (defensa en profundidad)
*/
export default function AvatarUploader({
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

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: fd,
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.url) {
        setError(data.error ?? "Error subiendo la imagen. Inténtalo de nuevo.");
        return;
      }

      setPreview(data.url);
      router.refresh();
    } catch (err) {
      setError(`Error de conexión: ${(err as Error).message}`);
    } finally {
      setUploading(false);
      // Limpia el input para que el mismo archivo pueda subirse de
      // nuevo (el evento "change" no dispara con el mismo file).
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setError("");
    setRemoving(true);

    try {
      const res = await fetch("/api/account/avatar", {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Error eliminando avatar.");
        return;
      }
      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(`Error de conexión: ${(err as Error).message}`);
    } finally {
      setRemoving(false);
    }
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
