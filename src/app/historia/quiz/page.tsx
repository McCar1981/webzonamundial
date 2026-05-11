import type { Metadata } from "next";
import Link from "next/link";
import Quiz from "@/components/historia/Quiz";
import { getQuiz } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title: "Quiz del Mundial — 20 preguntas para expertos | ZonaMundial",
  description:
    "Pon a prueba tu conocimiento sobre el Mundial: 20 preguntas con preguntas históricas (Klose, Salenko, VAR, Pelé, Maradona) y datos curiosos verificados.",
  alternates: { canonical: "https://zonamundial.app/historia/quiz" },
  openGraph: {
    title: "Quiz del Mundial | ZonaMundial",
    description: "20 preguntas para probar tu conocimiento mundialista.",
    url: "https://zonamundial.app/historia/quiz",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function QuizPage() {
  const preguntas = getQuiz();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Quiz</li>
        </ol>
      </nav>

      <header className="mb-8 sm:mb-10">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          {preguntas.length} preguntas verificadas
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 leading-[1.05]">
          Quiz del Mundial
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl">
          ¿Cuánto sabes del Mundial? Pon a prueba tu conocimiento con preguntas
          verificadas. Cada respuesta incluye explicación detallada para aprender.
        </p>
      </header>

      <section>
        <div className="p-5 sm:p-6 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/40">
          <Quiz preguntas={preguntas} />
        </div>
      </section>
    </>
  );
}
