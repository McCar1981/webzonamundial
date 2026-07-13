import type { Metadata } from "next";
import ComicViewer from "./ComicViewer";

// ponytail: ruta sin enlaces ni entrada en ningún menú — solo accesible sabiendo la URL exacta
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const TOTAL_PAGES = 24;

export default function ComicPreviewPage() {
  return <ComicViewer totalPages={TOTAL_PAGES} />;
}
