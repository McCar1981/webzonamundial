// /admin/newsletter — composer simple para envío masivo.
// El endpoint POST /api/admin/newsletter hace el trabajo pesado.

import type { Metadata } from "next";
import NewsletterComposer from "./NewsletterComposer";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = {
  title: "Newsletter · Panel interno",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function NewsletterAdminPage() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto text-white">
      <AdminHeader
        title="Newsletter"
        current="/admin/newsletter"
        description="Envío masivo a la lista de registros. Empieza con un dry-run para ver el número de destinatarios antes de mandar de verdad."
      />
      <NewsletterComposer />
    </div>
  );
}
