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

/** Registra el Service Worker (idempotente). */
export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration("/sw.js");
    if (existing) return existing;
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
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
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast a BufferSource: el tipado DOM de TS5 estrecha SharedArrayBuffer
      // fuera, pero el Uint8Array que devolvemos es una ArrayBuffer normal.
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
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
