import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Acceso interno",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return <LoginClient nextPath={searchParams.next || "/admin/registros"} />;
}
