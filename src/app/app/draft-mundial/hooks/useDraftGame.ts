// src/app/app/draft-mundial/hooks/useDraftGame.ts
// Hook principal de lógica del juego Draft Mundial

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
import { getFormacion } from "@/lib/draft/formaciones";
import { getPlantillaAleatoria, getOtraSeleccion, getOtroMundial } from "@/lib/draft/plantillas";
import {
  calcularResultado,
  calcularBalance,
  calcularCoherencia,
  aplicarBonusEstilo,
  puntosPorCalificacion,
  monedasPorCalificacion,
} from "@/lib/draft/simulacion";
import { Campana, calcularBonusCampana } from "@/lib/draft/campana";
import {
  DraftLogro,
  checkLogros,
  loadLogros,
  saveLogros,
  LOGROS,
} from "@/lib/draft/logros";

const CONTRARRELOJ_SEGUNDOS = 10;
// Re-tiradas disponibles por partida (compartidas entre "Otra selección" y
// "Otro mundial"). Limitadas para que la elección sea estratégica.
const REROLLS_INICIALES = 3;

export interface UseDraftGameReturn {
  phase: GamePhase;
  formacion: FormacionKey;
  estilo: Estilo;
  modo: Modo;
  posicionesPendientes: DraftPosicion[];
  equipo: Partial<Record<DraftPosicion, JugadorSeleccionado>>;
  tiradaActual: DraftPlantilla | null;
  resultado: DraftResultado | null;
  tiempoRestante: number | null;
  jugadoresDisponibles: JugadorSeleccionado[];
  progreso: number;
  guardando: boolean;
  logrosDesbloqueados: DraftLogro[];
  logrosNuevos: DraftLogro[];
  posicionesOcupadas: DraftPosicion[];
  rerollsRestantes: number;
  campanaBonus: number;
  puntajeParcial: number | null;
  coherenciaHint: string | null;

  // Acciones
  setFormacion: (f: FormacionKey) => void;
  setEstilo: (e: Estilo) => void;
  setModo: (m: Modo) => void;
  iniciarJuego: () => void;
  tirar: () => void;
  otraSeleccion: () => void;
  otroMundial: () => void;
  seleccionarJugador: (jugadorId: string) => void;
  finalizarConCampana: (campana: Campana) => Promise<void>;
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
  const [tiradaActual, setTiradaActual] = useState<DraftPlantilla | null>(null);
  const [resultado, setResultado] = useState<DraftResultado | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [logrosEstado, setLogrosEstado] = useState<Record<string, boolean>>(() => loadLogros());
  const [logrosNuevos, setLogrosNuevos] = useState<DraftLogro[]>([]);
  const [rerollsRestantes, setRerollsRestantes] = useState(REROLLS_INICIALES);
  const [campanaBonus, setCampanaBonus] = useState(0);

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
    setRerollsRestantes(REROLLS_INICIALES);
    setCampanaBonus(0);
  }, [formacion]);

  const otraSeleccion = useCallback(() => {
    if (phase !== "seleccion" || !tiradaActual || rerollsRestantes <= 0) return;
    setTiradaActual(getOtraSeleccion(tiradaActual));
    setRerollsRestantes((r) => r - 1);
  }, [phase, tiradaActual, rerollsRestantes]);

  const otroMundial = useCallback(() => {
    if (phase !== "seleccion" || !tiradaActual || rerollsRestantes <= 0) return;
    setTiradaActual(getOtroMundial(tiradaActual));
    setRerollsRestantes((r) => r - 1);
  }, [phase, tiradaActual, rerollsRestantes]);

  const tirar = useCallback(() => {
    if (posicionesPendientes.length === 0) return;

    const plantilla = getPlantillaAleatoria();
    setTiradaActual(plantilla);
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

  // Guarda el resultado en BD y acredita monedas. Se llama desde finalizarConCampana
  // DESPUÉS de que el usuario ve la campaña (incluye bonus por desempeño).
  const guardarResultado = useCallback(async (
    res: DraftResultado,
    eq: JugadorSeleccionado[],
    extraCoins = 0,
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
          coins: monedasPorCalificacion(res.calificacion) + extraCoins,
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

      const jugador = tiradaActual.jugadores.find((j) => j.id === jugadorId);
      if (!jugador) return;

      if (equipo[jugador.posicion]) return;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTiempoRestante(null);

      const seleccionado: JugadorSeleccionado = {
        ...jugador,
        seleccion: tiradaActual.seleccion,
        year: tiradaActual.year,
        bandera: tiradaActual.bandera,
      };

      const nuevoEquipo = { ...equipo, [jugador.posicion]: seleccionado };
      setEquipo(nuevoEquipo);

      const nuevasPosiciones = posicionesPendientes.filter((p) => p !== jugador.posicion);
      setPosicionesPendientes(nuevasPosiciones);

      if (nuevasPosiciones.length === 0) {
        setPhase("simulacion");
        setTimeout(() => {
          const eq = Object.values(nuevoEquipo).filter(Boolean) as JugadorSeleccionado[];
          const res = calcularResultado(eq, estilo);
          setResultado(res);

          const nuevos = checkLogros(res, eq, modo, logrosEstado);
          if (nuevos.length > 0) {
            const updated = { ...logrosEstado };
            nuevos.forEach((l) => { updated[l.id] = true; });
            setLogrosEstado(updated);
            saveLogros(updated);
            setLogrosNuevos(nuevos);
          }

          // guardarResultado se llama en finalizarConCampana (incluye bonus campaña).
          setPhase("campana");
        }, 1500);
      } else {
        setPhase("tirada");
        setTiradaActual(null);
      }
    },
    [tiradaActual, phase, estilo, equipo, logrosEstado, posicionesPendientes]
  );

  // Llamado desde CampanaScreen cuando el usuario termina de ver la campaña.
  // Calcula el bonus según el resultado, guarda todo y pasa a "resultado".
  const finalizarConCampana = useCallback(async (campana: Campana) => {
    const bonus = calcularBonusCampana(campana);
    setCampanaBonus(bonus);

    if (resultado) {
      const eq = Object.values(equipo).filter(Boolean) as JugadorSeleccionado[];
      await guardarResultado(resultado, eq, bonus);
    }

    setPhase("resultado");
  }, [resultado, equipo, guardarResultado]);

  const reiniciar = useCallback(() => {
    setPhase("setup");
    setPosicionesPendientes([]);
    setEquipo({});
    setResultado(null);
    setTiradaActual(null);
    setTiempoRestante(null);
    setGuardando(false);
    setLogrosNuevos([]);
    setRerollsRestantes(REROLLS_INICIALES);
    setCampanaBonus(0);
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
      const jugadoresValidos = tiradaActual.jugadores.filter((j) => !equipo[j.posicion]);
      if (jugadoresValidos.length > 0) {
        const elegido = jugadoresValidos[Math.floor(Math.random() * jugadoresValidos.length)];
        seleccionarJugador(elegido.id);
      }
    }
  }, [tiempoRestante, modo, tiradaActual, equipo, seleccionarJugador]);

  const jugadoresDisponibles = tiradaActual
    ? tiradaActual.jugadores
        .filter((j) => !equipo[j.posicion])
        .map((j) => ({
          ...j,
          seleccion: tiradaActual.seleccion,
          year: tiradaActual.year,
          bandera: tiradaActual.bandera,
        }))
    : [];

  const form = getFormacion(formacion);
  const totalPosiciones = form.posiciones.length;
  const completadas = totalPosiciones - posicionesPendientes.length;
  const progreso = totalPosiciones > 0 ? Math.round((completadas / totalPosiciones) * 100) : 0;
  const posicionesOcupadas = Object.keys(equipo).map((p) => p as DraftPosicion);

  const logrosDesbloqueados = LOGROS.filter((l) => logrosEstado[l.id]);

  // Puntaje proyectado: se activa solo con ≥ 5 jugadores colocados.
  const puntajeParcial = useMemo((): number | null => {
    const placed = Object.values(equipo).filter(Boolean) as JugadorSeleccionado[];
    if (placed.length < 5) return null;
    const jugadores = placed.map((j) => ({ posicion: j.posicion, fuerza: j.fuerza }));
    const fuerza = Math.round(placed.reduce((s, j) => s + j.fuerza, 0) / placed.length);
    const balance = calcularBalance(jugadores);
    const coherencia = calcularCoherencia(placed);
    const bonusEst = aplicarBonusEstilo(jugadores, estilo);
    return Math.min(100, Math.round(fuerza * 0.35 + balance * 0.30 + coherencia * 0.25 + bonusEst * 0.10));
  }, [equipo, estilo]);

  // Hint de coherencia: avisa cuando la selección activa un bonus por repetición.
  const coherenciaHint = useMemo((): string | null => {
    if (!tiradaActual || phase !== "seleccion") return null;
    const placed = Object.values(equipo).filter(Boolean) as JugadorSeleccionado[];
    const countSel = placed.filter((j) => j.seleccion === tiradaActual.seleccion).length;
    const countYear = placed.filter((j) => j.year === tiradaActual.year).length;
    if (countSel === 2) return `3er jugador de ${tiradaActual.seleccion} → +coherencia`;
    if (countSel >= 3) return `Más de ${tiradaActual.seleccion} → +coherencia`;
    if (countYear === 1) return `2do jugador del ${tiradaActual.year} → +coherencia`;
    return null;
  }, [tiradaActual, equipo, phase]);

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
    posicionesOcupadas,
    rerollsRestantes,
    campanaBonus,
    puntajeParcial,
    coherenciaHint,
    setFormacion,
    setEstilo,
    setModo,
    iniciarJuego,
    tirar,
    otraSeleccion,
    otroMundial,
    seleccionarJugador,
    finalizarConCampana,
    reiniciar,
    marcarLogrosVistos,
  };
}
