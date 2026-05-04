import type { Metadata } from "next";

/**
 * Admin section layout — passthrough for now.
 *
 * Lives under the root layout (so it inherits the LanguageProvider, fonts,
 * and JSON-LD), but the visual chrome (header/footer of the public site)
 * is rendered inside RootLayoutClient. Each admin page styles itself.
 *
 * SEO: noindex everything under /admin via metadata cascade.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
