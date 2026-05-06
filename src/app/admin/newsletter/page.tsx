// /admin/newsletter — composer simple para envío masivo.
// El endpoint POST /api/admin/newsletter hace el trabajo pesado.

import type { Metadata } from "next";
import NewsletterComposer from "./NewsletterComposer";

export const metadata: Metadata = {
  title: "Newsletter · Panel interno",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function NewsletterAdminPage() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto text-white">
      <h1 className="text-3xl font-black mb-2 tracking-tight">Newsletter</h1>
      <p className="text-gray-400 text-sm mb-8">
        Envío masivo a la lista de registros. Empieza con un dry-run para ver el
        número de destinatarios antes de mandar de verdad.
      </p>
      <NewsletterComposer />
    </div>
  );
}
