// public/sw.js
//
// Service Worker de ZonaMundial — gestiona Web Push notifications.
//
// Eventos manejados:
//   - "push"           → recibe payload del servidor, muestra notificación
//   - "notificationclick" → al clickear la notif, abre la URL del payload
//   - "pushsubscriptionchange" → renueva la subscription si el browser la rotó
//
// IMPORTANTE — el archivo DEBE estar en /public/sw.js (root público)
// para que su scope sea "/" y pueda recibir pushes desde cualquier página.

self.addEventListener("install", (event) => {
  // Skip waiting → el SW nuevo se activa inmediatamente sin esperar a
  // que se cierren las pestañas con la versión vieja.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  // Claim → tomar control de las pestañas abiertas sin recarga.
  event.waitUntil(self.clients.claim());
});

// Fetch handler (passthrough, sin caché). Chrome EXIGE que el SW tenga un
// manejador "fetch" para considerar la app instalable y disparar
// beforeinstallprompt. No interceptamos nada: dejamos que la red resuelva
// cada petición con normalidad.
self.addEventListener("fetch", () => {
  // no-op: sin respondWith → comportamiento de red por defecto.
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn("[sw] push received without data");
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "ZonaMundial",
      body: event.data.text() || "Nueva actualización",
      url: "/",
    };
  }

  const title = payload.title || "ZonaMundial";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/img/email/logo-zonamundial.png",
    // Badge monocromo 72x72 transparente: Android lo pinta en la barra de
    // estado. Un PNG a color saldría gris/borroso, por eso usamos el dedicado.
    badge: payload.badge || "/icons/badge-72.png",
    image: payload.image,
    tag: payload.tag || "news",
    // Si llega un push con el mismo tag, reemplaza al anterior.
    renotify: true,
    requireInteraction: false,
    data: {
      url: payload.url || "/",
      pushId: payload.pushId,
    },
    actions: [
      {
        action: "open",
        title: "Leer",
      },
    ],
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  // Si ya hay una pestaña de zonamundial abierta, foco. Si no, abrir nueva.
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Buscar pestaña con el origin de zonamundial.
      for (const c of clients) {
        try {
          const u = new URL(c.url);
          if (u.origin === self.location.origin) {
            return c.focus().then((focused) => {
              if (focused && "navigate" in focused) {
                return focused.navigate(targetUrl);
              }
              return focused;
            });
          }
        } catch {
          // ignore parse errors
        }
      }
      // Si no había ninguna, abrir nueva.
      return self.clients.openWindow(targetUrl);
    }),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  // El browser rotó la subscription (raro, pero pasa). Re-suscribir
  // y notificar al backend con la nueva. Como no podemos llamar a
  // funciones autenticadas desde el SW sin un endpoint público,
  // hacemos un POST a /api/notifications/push/resubscribe que actualiza
  // la fila por endpoint viejo → nuevo.
  event.waitUntil(
    (async () => {
      try {
        const newSub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: event.oldSubscription
            ? event.oldSubscription.options.applicationServerKey
            : null,
        });
        await fetch("/api/notifications/push/resubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldEndpoint: event.oldSubscription ? event.oldSubscription.endpoint : null,
            subscription: newSub.toJSON(),
          }),
        });
      } catch (err) {
        console.error("[sw] pushsubscriptionchange failed", err);
      }
    })(),
  );
});
