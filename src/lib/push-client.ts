// src/lib/push-client.ts
//
// Helpers de Web Push para usar desde el CLIENTE (browser).
// Registran el Service Worker, suscriben al PushManager y avisan al backend.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Soporte Web Push del navegador. iOS Safari requiere PWA instalada. */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Estado actual del permiso de notificaciones. */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/**
 * Registra el Service Worker (idempotente) Y espera a que esté "active".
 *
 * Esto es crítico: PushManager.subscribe() falla con AbortError si el SW
 * está aún en "installing" o "waiting". El navegador necesita un SW
 * activo y controlando el origin antes de que la suscripción sea válida.
 */
export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!reg) {
      reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }

    // Espera a que el SW esté activo. Hay 3 casos según el estado:
    //  - reg.active existe ya → listo
    //  - reg.installing/waiting → escuchamos su transición a 'activated'
    //  - ninguno → fallback al ready (resuelve cuando hay SW activo)
    if (reg.active && reg.active.state === "activated") {
      return reg;
    }

    const sw = reg.installing ?? reg.waiting ?? reg.active;
    if (sw && sw.state !== "activated") {
      await new Promise<void>((resolve) => {
        const onStateChange = () => {
          if (sw.state === "activated") {
            sw.removeEventListener("statechange", onStateChange);
            resolve();
          }
        };
        sw.addEventListener("statechange", onStateChange);
        // Safety timeout: 8s. Si no llega a activated, dejamos seguir
        // y el subscribe se reintentará externamente si falla.
        setTimeout(resolve, 8000);
      });
    }

    // serviceWorker.ready resuelve cuando hay un SW activo controlando
    // el scope — es la garantía oficial del navegador.
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error("[push-client] SW register failed:", err);
    return null;
  }
}

/** Convierte el VAPID public key base64url a Uint8Array (formato requerido por subscribe). */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Pide permiso al usuario, suscribe al PushManager y manda la subscription al backend.
 * Devuelve la subscription si todo fue bien, null si el user denegó o algo falló.
 */
export async function subscribeToPush(opts?: {
  kinds?: string[];
}): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  if (!VAPID_PUBLIC_KEY) {
    console.error("[push-client] NEXT_PUBLIC_VAPID_PUBLIC_KEY missing");
    return null;
  }

  const reg = await ensureServiceWorker();
  if (!reg) return null;

  // Pide permiso (idempotente si ya estaba granted).
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  // Reusa subscription si ya existe.
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    // Retry una vez si AbortError (SW aún transitando a activated).
    const subscribeOpts = {
      userVisibleOnly: true,
      // Cast a BufferSource: el tipado DOM de TS5 estrecha SharedArrayBuffer
      // fuera, pero el Uint8Array que devolvemos es una ArrayBuffer normal.
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    };
    try {
      sub = await reg.pushManager.subscribe(subscribeOpts);
    } catch (err) {
      const name = (err as Error)?.name;
      if (name === "AbortError" || name === "InvalidStateError") {
        // SW transitando: esperar ready oficial y reintentar.
        await navigator.serviceWorker.ready;
        await new Promise((r) => setTimeout(r, 500));
        sub = await reg.pushManager.subscribe(subscribeOpts);
      } else {
        throw err;
      }
    }
  }

  // Envía la subscription al backend para persistirla.
  try {
    await fetch("/api/notifications/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: sub.toJSON(),
        kinds: opts?.kinds ?? ["news"],
        locale: typeof navigator !== "undefined" ? navigator.language : undefined,
      }),
    });
  } catch (err) {
    console.error("[push-client] subscribe POST failed:", err);
    // No deshacemos la subscription del browser — el siguiente intento
    // re-enviará al backend.
  }

  return sub;
}

/**
 * Desuscribe del browser + backend. Idempotente.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  const endpoint = sub.endpoint;
  try {
    await sub.unsubscribe();
  } catch (err) {
    console.error("[push-client] browser unsubscribe failed:", err);
  }
  try {
    await fetch("/api/notifications/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  } catch (err) {
    console.error("[push-client] backend unsubscribe failed:", err);
  }
  return true;
}

/** ¿Ya tiene este browser una subscription activa? */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!reg) return null;
  return await reg.pushManager.getSubscription();
}

/**
 * "Seguir partido" (efecto pin de Google). Asegura permiso + suscripción y
 * registra/quita este browser como seguidor del partido en el backend. El cron
 * del Match Center le mandará la notificación fijada con marcador y minuto.
 * Devuelve el estado resultante (true = siguiendo) o null si no se pudo.
 */
export async function setMatchFollow(
  matchId: number,
  follow: boolean,
): Promise<boolean | null> {
  if (!isPushSupported()) return null;
  // Para seguir hace falta una suscripción; subscribeToPush es idempotente y
  // pide permiso si aún no lo hay.
  let sub = await getCurrentSubscription();
  if (!sub && follow) {
    sub = await subscribeToPush({ kinds: ["tournament-key-events"] });
  }
  if (!sub) return null;
  try {
    const r = await fetch("/api/match-center/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, follow, subscription: sub.toJSON() }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { following?: boolean };
    return !!data.following;
  } catch (err) {
    console.error("[push-client] setMatchFollow failed:", err);
    return null;
  }
}

/** ¿Este browser sigue el partido? (consulta el backend por endpoint). */
export async function getMatchFollow(matchId: number): Promise<boolean> {
  const sub = await getCurrentSubscription();
  if (!sub) return false;
  try {
    const r = await fetch(
      `/api/match-center/follow?matchId=${matchId}&endpoint=${encodeURIComponent(sub.endpoint)}`,
      { cache: "no-store" },
    );
    if (!r.ok) return false;
    const data = (await r.json()) as { following?: boolean };
    return !!data.following;
  } catch {
    return false;
  }
}
