"use client";

// Componente invisible que se monta una vez en el cliente y verifica si
// hay una suscripción push activa. Si la encuentra, hace ping al backend
// para asegurar que el token sigue válido y refresca metadata. Si el
// service worker rotó el endpoint, se sincroniza vía /api/.../resubscribe.
//
// PROBLEMA QUE RESUELVE: el usuario móvil reportó que la primera push
// llegó pero las siguientes no. Causa típica: Chrome móvil rota el push
// endpoint sin avisar al servidor → el backend cree que tiene un suscriptor
// pero el navegador real escucha en otro endpoint nuevo.
//
// Se monta en RootLayoutClient para correr en TODAS las páginas.

import { useEffect } from "react";
import { isPushSupported, ensureServiceWorker } from "@/lib/push-client";

const RESYNC_KEY = "zm.push.lastResyncAt";
const RESYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

export default function PushAutoResync() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isPushSupported()) return;
      if (typeof Notification === "undefined") return;
      // Solo si el usuario ya concedió permiso (no perseguimos visitas
      // anónimas — eso lo hace PushOptInBanner).
      if (Notification.permission !== "granted") return;

      // No-spam: solo intentar resync cada 24h por dispositivo.
      try {
        const last = parseInt(localStorage.getItem(RESYNC_KEY) || "0", 10);
        if (Date.now() - last < RESYNC_INTERVAL_MS) return;
      } catch {
        /* localStorage no disponible — seguimos */
      }

      const reg = await ensureServiceWorker();
      if (!reg || cancelled) return;

      const currentSub = await reg.pushManager.getSubscription();
      if (!currentSub || cancelled) {
        // El navegador no tiene suscripción activa. El permiso está
        // concedido pero el SW perdió la subscription (común en móvil).
        // No intentamos re-suscribir silenciosamente — el banner lo
        // pedirá explícitamente la próxima vez que el user lo vea.
        return;
      }

      // Hacer ping al backend para refrescar la metadata y descartar
      // que esté marcada como "gone".
      try {
        await fetch("/api/notifications/push/resubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldEndpoint: currentSub.endpoint, // mismo endpoint = no-op
            subscription: currentSub.toJSON(),
          }),
        });
        try {
          localStorage.setItem(RESYNC_KEY, String(Date.now()));
        } catch {
          /* ignore */
        }
      } catch (err) {
        // Silencioso — no es crítico, se reintentará en la próxima carga.
        console.warn("[push-auto-resync] failed:", (err as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
