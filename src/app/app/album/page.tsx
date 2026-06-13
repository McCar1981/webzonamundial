"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function AlbumPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/album/mi-coleccion");
  }, [router]);

  return (
    <div className={styles.page}>
      <div>
        <div className={styles.spinner} />
        <p className={styles.text}>Redirigiendo al catálogo...</p>
      </div>
    </div>
  );
}
