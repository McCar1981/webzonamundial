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
import { calcularResultado, puntosPorCalificacion, monedasPorCalificacion } from "@/lib/draft/simulacion";
import {
  DraftLogro,
  checkLogros,
  loadLogros,
  saveLogros,
  LOGROS,
} from "@/lib/draft/logros";

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
  guardando: boolean;
  logrosDesbloqueados: DraftLogro[];
  logrosNuevos: DraftLogro[];

  // Acciones
  setFormacion: (f: FormacionKey) => void;
  setEstilo: (e: Estilo) => void;
  setModo: (m: Modo) => void;
  iniciarJuego: () => void;
  tirar: () => void;
  seleccionarJugador: (jugadorId: string) => void;
  reiniciar: () => void;
  marcarLogrosVistos: () => void;
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
  const [guardando, setGuardando] = useState(false);
  const [logrosEstado, setLogrosEstado] = useState<Record<string, boolean>>(() => loadLogros());
  const [logrosNuevos, setLogrosNuevos] = useState<DraftLogro[]>([]);

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
    setLogrosNuevos([]);
    setGuardando(false);
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
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [posicionesPendientes, modo]);

  const guardarResultado = useCallback(async (
    res: DraftResultado,
    eq: JugadorSeleccionado[]
  ) => {
    setGuardando(true);
    try {
      const equipoJson = eq.map((j) => ({
        posicion: j.posicion,
        nombre: j.nombre,
        seleccion: j.seleccion,
        year: j.year,
        fuerza: j.fuerza,
      }));

      await fetch("/api/draft/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formacion,
          estilo,
          modo,
          puntaje: res.puntaje,
          calificacion: res.calificacion,
          fuerza: res.fuerza,
          balance: res.balance,
          coherencia: res.coherencia,
          bonusEstilo: res.bonusEstilo,
          equipo: equipoJson,
          coins: monedasPorCalificacion(res.calificacion),
          xp: puntosPorCalificacion(res.calificacion),
        }),
      });
    } catch (e) {
      console.error("[draft] error guardando resultado:", e);
    } finally {
      setGuardando(false);
    }
  }, [formacion, estilo, modo]);

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

      const nuevoEquipo = { ...equipo, [tiradaActual.posicion]: seleccionado };
      setEquipo(nuevoEquipo);

      setPosicionesPendientes((prev) => {
        const nuevas = prev.slice(1);
        if (nuevas.length === 0) {
          // Juego terminado
          setPhase("simulacion");
          setTimeout(() => {
            const eq = Object.values(nuevoEquipo).filter(
              Boolean
            ) as JugadorSeleccionado[];
            const res = calcularResultado(eq, estilo);
            setResultado(res);

            // Check logros
            const nuevos = checkLogros(res, eq, modo, logrosEstado);
            if (nuevos.length > 0) {
              const updated = { ...logrosEstado };
              nuevos.forEach((l) => { updated[l.id] = true; });
              setLogrosEstado(updated);
              saveLogros(updated);
              setLogrosNuevos(nuevos);
            }

            // Guardar resultado
            guardarResultado(res, eq);

            setPhase("resultado");
          }, 1500);
          return nuevas;
        }
        setPhase("tirada");
        setTiradaActual(null);
        return nuevas;
      });
    },
    [tiradaActual, phase, estilo, equipo, logrosEstado, guardarResultado]
  );

  const reiniciar = useCallback(() => {
    setPhase("setup");
    setPosicionesPendientes([]);
    setEquipo({});
    setResultado(null);
    setTiradaActual(null);
    setTiempoRestante(null);
    setGuardando(false);
    setLogrosNuevos([]);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const marcarLogrosVistos = useCallback(() => {
    setLogrosNuevos([]);
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

  const logrosDesbloqueados = LOGROS.filter((l) => logrosEstado[l.id]);

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
    guardando,
    logrosDesbloqueados,
    logrosNuevos,
    setFormacion,
    setEstilo,
    setModo,
    iniciarJuego,
    tirar,
    seleccionarJugador,
    reiniciar,
    marcarLogrosVistos,
  };
}
