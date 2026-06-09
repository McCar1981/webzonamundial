// src/app/app/stories/page.tsx — landing retirado (traía confusión); redirige al feed real.
import { redirect } from "next/navigation";

export default function StoriesIndexPage() {
  redirect("/app/stories/feed");
}
