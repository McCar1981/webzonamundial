"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { haptic, celebratePop } from "@/lib/celebration";
import FlagImage from "@/components/FlagImage";
import type { HLMode, HLPhase, HLGuess, HLRound, HLResult } from "@/lib/higher-lower/types";
import { generateRounds, isCorrect, guessLabels } from "@/lib/higher-lower/cards";

const GOLD = "#c9a84c";

export default function HigherLowerClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale, t } = useLanguage();
  const hl = t.higherLower;

  const [phase, setPhase] = useState<HLPhase>("menu");
  const [mode, setMode] = useState<HLMode | null>(null);
  const [rounds, setRounds] = useState<HLRound[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [result, setResult] = useState<HLResult | null>(null);
  const scoreRef = useRef<HTMLDivElement>(null);

  const urlMode = useMemo(() => {
    const m = searchParams.get("mode");
    return m === "jugadores" || m === "selecciones" ? m : null;
  }, [searchParams]);

  useEffect(() => {
    if (urlMode) {
      startGame(urlMode);
    } else {
      setPhase("menu");
    }
  }, [urlMode]);

  const startGame = useCallback((m: HLMode) => {
    setMode(m);
    setRounds(generateRounds(m, 15));
    setIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setRevealed(false);
    setCorrect(null);
    setResult(null);
    setPhase("playing");
  }, []);

  const currentRound = rounds[index];

  const handleGuess = useCallback(
    (guess: HLGuess) => {
      if (!currentRound || revealed) return;
      const ok = isCorrect(guess, currentRound.left, currentRound.right, currentRound.metric);
      setRevealed(true);
      setCorrect(ok);

      if (ok) {
        const newScore = score + 1;
        const newStreak = streak + 1;
        setScore(newScore);
        setStreak(newStreak);
        setBestStreak((prev) => Math.max(prev, newStreak));
        haptic(10);
        if (newStreak >= 3) celebratePop(scoreRef.current);
        window.setTimeout(() => {
          if (index + 1 >= rounds.length) {
            setResult({
              score: newScore,
              bestStreak: Math.max(newStreak, bestStreak),
              totalRounds: rounds.length,
              lastRound: currentRound,
            });
            setPhase("result");
          } else {
            setIndex((i) => i + 1);
            setRevealed(false);
            setCorrect(null);
          }
        }, 1200);
      } else {
        haptic([30, 40]);
        window.setTimeout(() => {
          setResult({ score, bestStreak, totalRounds: rounds.length, lastRound: currentRound });
          setPhase("result");
        }, 900);
      }
    },
    [currentRound, revealed, score, streak, bestStreak, index, rounds.length]
  );

  const labels = currentRound
    ? guessLabels(currentRound.metric, locale)
    : { higher: hl.game.higher, lower: hl.game.lower };

  if (phase === "menu" || !mode) {
    return (
      <main className="min-h-screen bg-zm-bg text-zm-text font-outfit flex flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-8">{hl.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {(["selecciones", "jugadores"] as HLMode[]).map((m) => (
            <button
              key={m}
              onClick={() => router.push(`/app/higher-lower/jugar?mode=${m}`)}
              className="rounded-2xl border border-zm-border bg-zm-surface p-8 transition hover:border-zm-gold/60"
            >
              <h2 className="text-2xl font-semibold mb-2">
                {m === "selecciones" ? hl.menu.seleccionesTitle : hl.menu.jugadoresTitle}
              </h2>
              <p className="text-zm-text-muted">
                {m === "selecciones" ? hl.menu.seleccionesDesc : hl.menu.jugadoresDesc}
              </p>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (phase === "result" && result) {
    return (
      <main className="min-h-screen bg-zm-bg text-zm-text font-outfit flex flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-2">{hl.result.title}</h1>
        <p className="text-zm-text-muted mb-8">{hl.game.gameOver}</p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl bg-zm-surface border border-zm-border p-6">
            <div className="text-3xl font-bold text-zm-gold">{result.score}</div>
            <div className="text-sm text-zm-text-muted">{hl.result.scoreLabel}</div>
          </div>
          <div className="rounded-xl bg-zm-surface border border-zm-border p-6">
            <div className="text-3xl font-bold text-zm-gold">{result.bestStreak}</div>
            <div className="text-sm text-zm-text-muted">{hl.result.streakLabel}</div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => startGame(mode)}
            className="px-6 py-3 rounded-full font-medium text-zm-bg transition hover:opacity-90"
            style={{ background: GOLD }}
          >
            {hl.game.playAgain}
          </button>
          <Link
            href="/app/higher-lower"
            className="px-6 py-3 rounded-full border border-zm-gold text-zm-gold hover:bg-zm-gold/10 transition"
          >
            {hl.game.changeMode}
          </Link>
        </div>
      </main>
    );
  }

  // playing
  return (
    <main className="min-h-screen bg-zm-bg text-zm-text font-outfit flex flex-col">
      <header className="flex items-center justify-between px-4 py-4 border-b border-zm-border">
        <Link href="/app/higher-lower" className="text-zm-text-muted hover:text-zm-gold transition">
          ← {hl.game.changeMode}
        </Link>
        <div className="flex gap-4 text-sm">
          <div ref={scoreRef}>
            {hl.game.score}: <span className="text-zm-gold font-bold">{score}</span>
          </div>
          <div>
            {hl.game.streak}: <span className="text-zm-gold font-bold">{streak}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        <Card
          card={currentRound.left}
          revealed={true}
          metricLabel={hl.metrics[currentRound.metric.key as keyof typeof hl.metrics] ?? currentRound.metric.key}
        />
        <div className="relative flex-1 flex flex-col items-center justify-center p-4 border-t md:border-t-0 md:border-l border-zm-border">
          {revealed && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className={`text-4xl font-bold ${correct ? "text-green-400" : "text-red-400"}`}>
                {correct ? hl.game.correct : hl.game.wrong}
              </div>
            </div>
          )}
          <Card
            card={currentRound.right}
            revealed={revealed}
            metricLabel={hl.metrics[currentRound.metric.key as keyof typeof hl.metrics] ?? currentRound.metric.key}
          />
          {!revealed && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => handleGuess("higher")}
                className="px-6 py-3 rounded-full font-medium text-zm-bg transition hover:opacity-90"
                style={{ background: GOLD }}
              >
                {labels.higher}
              </button>
              <button
                onClick={() => handleGuess("lower")}
                className="px-6 py-3 rounded-full border border-zm-gold text-zm-gold hover:bg-zm-gold/10 transition"
              >
                {labels.lower}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Card({ card, revealed, metricLabel }: { card: HLRound["left"]; revealed: boolean; metricLabel: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-24 h-16 mb-4 rounded-lg overflow-hidden border border-zm-border">
        <FlagImage code={card.image} alt={card.name} width={96} className="w-full h-full" />
      </div>
      <h3 className="text-2xl font-bold text-center mb-1">{card.name}</h3>
      <p className="text-zm-text-muted text-sm mb-4 text-center">{card.subtitle}</p>
      <div className="text-sm text-zm-text-muted mb-1">{metricLabel}</div>
      <div className={`text-4xl font-bold transition ${revealed ? "text-zm-gold" : "text-zm-text-muted"}`}>
        {revealed ? card.displayValue : "?"}
      </div>
    </div>
  );
}
