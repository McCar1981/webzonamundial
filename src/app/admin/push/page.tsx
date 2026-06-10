// /admin/push — generador MANUAL de notificaciones push.
// Protegido por middleware /admin/* (cookie zm_admin). Carlos redacta un push
// (título, mensaje, destino, imagen, categoría) y lo envía a los suscriptores
// en el momento. Complementa los push automáticos por situación de partido.

import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import PushComposer from "./PushComposer";

export const metadata: Metadata = {
  title: "Push manual · Panel interno",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function AdminPushPage() {
  return (
    <div className="min-h-screen bg-[#060B14] text-white">
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <AdminHeader
          title="Push manual"
          description="Redacta y envía una notificación push a los suscriptores. Para envíos automáticos por partido existe el motor de Match Center; esto es para avisos puntuales que decides tú."
          current="/admin/push"
        />
        <PushComposer />
      </div>
    </div>
  );
}
