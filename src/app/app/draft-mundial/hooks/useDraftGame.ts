// src/app/app/draft-mundial/hooks/useDraftGame.ts
// Hook principal de lógica del juego Draft Mundial

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DraftPosicion,
  DraftPlantilla,
  FormacionKey,
  Estilo,
  Modo,
  GamePhase,
  DraftResultado,
  JugadorSeleccionado,
} from "@/lib/draft/types";
import { getFormacion, posicionesCompatibles } from "@/lib/draft/formaciones";
import { getPlantillaAleatoria } from "@/lib/draft/plantillas";
import { calcularResultado } from "@/lib/draft/simulacion";

const CONTRARRELOJ_SEGUNDOS = 15;

export interface UseDraftGameReturn {
  phase: GamePhase;
  formacion: FormacionKey;
  estilo: Estilo;
  modo: Modo;
  posicionesPendientes: DraftPosicion[];
  equipo: Partial<Record<DraftPosicion, JugadorSeleccionado>>;
  tiradaActual: { plantilla: DraftPlantilla; posicion: DraftPosicion } | null;
  resultado: DraftResultado | null;
  tiempoRestante: number | null;
  jugadoresDisponibles: JugadorSeleccionado[];
  progreso: number;

  // Acciones
  setFormacion: (f: FormacionKey) => void;
  setEstilo: (e: Estilo) => void;
  setModo: (m: Modo) => void;
  iniciarJuego: () => void;
  tirar: () => void;
  seleccionarJugador: (jugadorId: string) => void;
  reiniciar: () => void;
}

export function useDraftGame(): UseDraftGameReturn {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [formacion, setFormacion] = useState<FormacionKey>("4-3-3");
  const [estilo, setEstilo] = useState<Estilo>("equilibrado");
  const [modo, setModo] = useState<Modo>("clasico");
  const [posicionesPendientes, setPosicionesPendientes] = useState<DraftPosicion[]>([]);
  const [equipo, setEquipo] = useState<Partial<Record<DraftPosicion, JugadorSeleccionado>>>({});
  const [tiradaActual, setTiradaActual] = useState<{ plantilla: DraftPlantilla; posicion: DraftPosicion } | null>(null);
  const [resultado, setResultado] = useState<DraftResultado | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const iniciarJuego = useCallback(() => {
    const form = getFormacion(formacion);
    setPosicionesPendientes([...form.posiciones]);
    setEquipo({});
    setResultado(null);
    setTiradaActual(null);
    setPhase("tirada");
    setTiempoRestante(null);
  }, [formacion]);

  const tirar = useCallback(() => {
    if (posicionesPendientes.length === 0) return;

    const plantilla = getPlantillaAleatoria();
    const posicion = posicionesPendientes[0];

    setTiradaActual({ plantilla, posicion });
    setPhase("seleccion");

    if (modo === "contrarreloj") {
      setTiempoRestante(CONTRARRELOJ_SEGUNDOS);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto-seleccionar al azar
            const jugadores = plantilla.jugadores.filter((j) =>
              posicionesCompatibles(posicion, j.posicion)
            );
            if (jugadores.length > 0) {
              const elegido = jugadores[Math.floor(Math.random() * jugadores.length)];
              // Llamar a seleccionarJugador con el ID
              // Necesitamos hacer esto fuera del setState
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [posicionesPendientes, modo]);

  const seleccionarJugador = useCallback(
    (jugadorId: string) => {
      if (!tiradaActual || phase !== "seleccion") return;

      const jugador = tiradaActual.plantilla.jugadores.find((j) => j.id === jugadorId);
      if (!jugador) return;

      // Limpiar timer si existe
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTiempoRestante(null);

      const seleccionado: JugadorSeleccionado = {
        ...jugador,
        seleccion: tiradaActual.plantilla.seleccion,
        year: tiradaActual.plantilla.year,
        bandera: tiradaActual.plantilla.bandera,
      };

      setEquipo((prev) => ({ ...prev, [tiradaActual.posicion]: seleccionado }));

      setPosicionesPendientes((prev) => {
        const nuevas = prev.slice(1);
        if (nuevas.length === 0) {
          // Juego terminado
          setPhase("simulacion");
          setTimeout(() => {
            const eq = Object.values({ ...equipo, [tiradaActual.posicion]: seleccionado }).filter(
              Boolean
            ) as JugadorSeleccionado[];
            const res = calcularResultado(eq, estilo);
            setResultado(res);
            setPhase("resultado");
          }, 1500);
          return nuevas;
        }
        setPhase("tirada");
        setTiradaActual(null);
        return nuevas;
      });
    },
    [tiradaActual, phase, estilo, equipo]
  );

  const reiniciar = useCallback(() => {
    setPhase("setup");
    setPosicionesPendientes([]);
    setEquipo({});
    setResultado(null);
    setTiradaActual(null);
    setTiempoRestante(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Auto-seleccionar cuando el tiempo se acaba en contrarreloj
  useEffect(() => {
    if (modo === "contrarreloj" && tiempoRestante === 0 && tiradaActual) {
      const jugadores = tiradaActual.plantilla.jugadores.filter((j) =>
        posicionesCompatibles(tiradaActual.posicion, j.posicion)
      );
      if (jugadores.length > 0) {
        const elegido = jugadores[Math.floor(Math.random() * jugadores.length)];
        seleccionarJugador(elegido.id);
      }
    }
  }, [tiempoRestante, modo, tiradaActual, seleccionarJugador]);

  const jugadoresDisponibles = tiradaActual
    ? tiradaActual.plantilla.jugadores
        .filter((j) => posicionesCompatibles(tiradaActual.posicion, j.posicion))
        .map((j) => ({
          ...j,
          seleccion: tiradaActual.plantilla.seleccion,
          year: tiradaActual.plantilla.year,
          bandera: tiradaActual.plantilla.bandera,
        }))
    : [];

  const form = getFormacion(formacion);
  const totalPosiciones = form.posiciones.length;
  const completadas = totalPosiciones - posicionesPendientes.length;
  const progreso = totalPosiciones > 0 ? Math.round((completadas / totalPosiciones) * 100) : 0;

  return {
    phase,
    formacion,
    estilo,
    modo,
    posicionesPendientes,
    equipo,
    tiradaActual,
    resultado,
    tiempoRestante,
    jugadoresDisponibles,
    progreso,
    setFormacion,
    setEstilo,
    setModo,
    iniciarJuego,
    tirar,
    seleccionarJugador,
    reiniciar,
  };
}
