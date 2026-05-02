/**
 * Reusable Breadcrumb component for dynamic pages.
 *
 * Renders both:
 *  - Visible <nav> with <ol> list of links — UX
 *  - JSON-LD BreadcrumbList — SEO (rich result in SERP)
 *
 * Use anywhere outside /noticias/[slug] (which has its own inline version).
 */

import Link from "next/link";
import styles from "./Breadcrumb.module.css";

const SITE_URL = "https://zonamundial.app";

export interface BreadcrumbItem {
  /** Visible label (e.g. "Selecciones") */
  label: string;
  /** Path WITHOUT the domain (e.g. "/selecciones"). Last item: omit href so it renders as plain text. */
  href?: string;
}

export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (!items.length) return null;

  // Always start with Inicio
  const fullItems: BreadcrumbItem[] = [
    { label: "Inicio", href: "/" },
    ...items,
  ];

  // JSON-LD: BreadcrumbList
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: fullItems.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.label,
      item: item.href ? `${SITE_URL}${item.href}` : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="Breadcrumb"
        className={`${styles.breadcrumb} ${className || ""}`.trim()}
      >
        <ol className={styles.list}>
          {fullItems.map((item, idx) => {
            const isLast = idx === fullItems.length - 1;
            return (
              <li key={`${item.label}-${idx}`} className={styles.item}>
                {item.href && !isLast ? (
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={isLast ? styles.current : styles.text}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
                {!isLast && (
                  <span className={styles.separator} aria-hidden>
                    ›
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
