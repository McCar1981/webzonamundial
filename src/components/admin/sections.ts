// Catálogo único de las secciones del panel interno (/admin/*).
// Lo consumen AdminHeader (breadcrumb + nav) y el hub /admin/panel, para que
// añadir o quitar una sección sea un solo cambio.

export interface AdminSection {
  href: string;
  label: string;
  emoji: string;
  desc: string;
}

export const ADMIN_HOME = "/admin/panel";

export const ADMIN_SECTIONS: AdminSection[] = [
  { href: "/admin/creadores", label: "Creadores", emoji: "🎬", desc: "Programa de monetización: registros, bonos y pagos por creador." },
  { href: "/admin/registros", label: "Registros", emoji: "📝", desc: "Altas de usuarios y su fuente de captación." },
  { href: "/admin/founders", label: "Founders", emoji: "👑", desc: "Compradores del Founders Pass e ingresos." },
  { href: "/admin/pro", label: "Plan Pro", emoji: "💎", desc: "Funnel de conversión y choques con límites Free." },
  { href: "/admin/push", label: "Push", emoji: "🔔", desc: "Enviar una notificación push manual a los suscriptores." },
  { href: "/admin/newsletter", label: "Newsletter", emoji: "✉️", desc: "Envío masivo de email a la lista." },
  { href: "/admin/bars", label: "Bares", emoji: "🍺", desc: "Estado de las porras digitales de bares." },
  { href: "/admin/monitor", label: "Monitor", emoji: "🩺", desc: "Centro de control en vivo y auto-remediación." },
  { href: "/admin/module-interest", label: "Módulos", emoji: "📊", desc: "Interés registrado por cada módulo próximamente." },
];

export function sectionByHref(href: string): AdminSection | undefined {
  return ADMIN_SECTIONS.find((s) => s.href === href);
}
