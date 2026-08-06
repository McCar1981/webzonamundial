import type { Metadata } from "next";
import { Suspense } from "react";
import HigherLowerClient from "./HigherLowerClient";

export const metadata: Metadata = {
  title: "Higher or Lower · Jugar | ZonaMundial",
  description: "Acierta si el siguiente dato es mayor o menor.",
};

export default function HigherLowerJugarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zm-bg" />}>
      <HigherLowerClient />
    </Suspense>
  );
}
