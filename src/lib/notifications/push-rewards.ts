// src/lib/notifications/push-rewards.ts
//
// Recompensa única por activar las notificaciones push. Vive fuera de la route
// porque una route del App Router solo puede exportar handlers y config de Next
// (`runtime`, `dynamic`, `GET`, `POST`…): cualquier otro export rompe el
// typecheck de `.next/types` (TS2344).
//
// Módulo sin dependencias: lo consumen tanto la route (servidor) como los
// puntos de activación en cliente (onboarding, lobby, perfil…).

/** Fútcoins que se abonan la primera vez que el usuario activa las push. */
export const PUSH_REWARD_COINS = 25;
/** XP que se abona junto con las Fútcoins. */
export const PUSH_REWARD_XP = 10;
