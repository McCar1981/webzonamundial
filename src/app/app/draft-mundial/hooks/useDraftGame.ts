// src/app/app/draft-mundial/hooks/useDraftGame.ts
// Hook principal de lógica del juego Draft Mundial
//
// MODELO POR CASILLA: el equipo se guarda como un mapa { idCasilla → jugador }
// en vez de { posición → jugador }. Así una formación con dos centrales o dos
// interiores (4-3-3, 5-3-2…) se respeta de verdad: cada casilla es un hueco
// independiente con su coordenada en el campo (ver lib/draft/layout.ts).

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
import { layoutFormacion, SlotLayout } from "@/lib/draft/layout";
import { getPlantillaAleatoria, getOtraSeleccion, getOtroMundial } from "@/lib/draft/plantillas";
import {
  calcularResultado,
  calcularBalance,
  calcularCoherencia,
  aplicarBonusEstilo,
} from "@/lib/draft/simulacion";
import { Campana, calcularBonusCampana } from "@/lib/draft/campana";
import { calcularRecompensaDraft, RecompensaDraft } from "@/lib/draft/recompensa";
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

const TODAS_POSICIONES: DraftPosicion[] = [
  "GOL", "LD", "ZAG", "LE", "VOL", "MEI", "MCD", "EXT", "CA", "PD", "PI",
];

type Equipo = Record<number, JugadorSeleccionado>;

function normNombre(n: string): string {
  return n.trim().toLowerCase();
}

/** Nombres de los jugadores ya en el once (para no repetir el mismo jugador). */
function nombresEnEquipo(equipo: Equipo): Set<string> {
  return new Set(Object.values(equipo).map((j) => normNombre(j.nombre)));
}

/**
 * Hueco libre de la MISMA posición EXACTA. Sin compatibilidades: un delantero
 * centro solo entra en una casilla de DC, un lateral derecho solo en LD, etc.
 * (realista). Devuelve el id de la casilla o null si esa posición está llena.
 */
function slotExactoLibre(slots: SlotLayout[], equipo: Equipo, pos: DraftPosicion): number | null {
  const libre = slots.find((s) => !(s.id in equipo) && s.pos === pos);
  return libre ? libre.id : null;
}

/** ¿Se puede fichar este jugador? No debe estar ya en el once y su posición
 *  exacta debe tener hueco libre. */
function jugadorElegible(
  slots: SlotLayout[],
  equipo: Equipo,
  nombres: Set<string>,
  jug: { posicion: DraftPosicion; nombre: string },
): boolean {
  if (nombres.has(normNombre(jug.nombre))) return false;
  return slotExactoLibre(slots, equipo, jug.posicion) !== null;
}

export interface UseDraftGameReturn {
  phase: GamePhase;
  formacion: FormacionKey;
  estilo: Estilo;
  modo: Modo;
  slots: SlotLayout[];
  slotActivo: number | null;
  equipo: Equipo;
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
  recompensa: RecompensaDraft | null;
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
  const [equipo, setEquipo] = useState<Equipo>({});
  const [tiradaActual, setTiradaActual] = useState<DraftPlantilla | null>(null);
  const [resultado, setResultado] = useState<DraftResultado | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [logrosEstado, setLogrosEstado] = useState<Record<string, boolean>>(() => loadLogros());
  const [logrosNuevos, setLogrosNuevos] = useState<DraftLogro[]>([]);
  const [rerollsRestantes, setRerollsRestantes] = useState(REROLLS_INICIALES);
  const [campanaBonus, setCampanaBonus] = useState(0);
  const [recompensa, setRecompensa] = useState<RecompensaDraft | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Casillas de la formación elegida (con coordenadas).
  const slots = useMemo(() => layoutFormacion(formacion), [formacion]);

  // Primera casilla libre (la que el campo resalta como "siguiente").
  const slotActivo = useMemo(() => {
    const libre = slots.find((s) => !(s.id in equipo));
    return libre ? libre.id : null;
  }, [slots, equipo]);

  const completo = Object.keys(equipo).length >= slots.length;

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const iniciarJuego = useCallback(() => {
    setEquipo({});
    setResultado(null);
    setTiradaActual(null);
    setPhase("tirada");
    setTiempoRestante(null);
    setLogrosNuevos([]);
    setGuardando(false);
    setRerollsRestantes(REROLLS_INICIALES);
    setCampanaBonus(0);
    setRecompensa(null);
  }, []);

  const otraSeleccion = useCallback(() => {
    if (phase !== "seleccion" || !tiradaActual) return;
    const nombres = nombresEnEquipo(equipo);
    const hayElegibles = tiradaActual.jugadores.some((j) => jugadorElegible(slots, equipo, nombres, j));
    // Re-tirada GRATIS si la selección no aporta ningún jugador fichable
    // (ningún hueco encaja): así nunca se bloquea la partida.
    if (rerollsRestantes <= 0 && hayElegibles) return;
    setTiradaActual(getOtraSeleccion(tiradaActual));
    if (hayElegibles) setRerollsRestantes((r) => r - 1);
  }, [phase, tiradaActual, rerollsRestantes, slots, equipo]);

  const otroMundial = useCallback(() => {
    if (phase !== "seleccion" || !tiradaActual) return;
    const nombres = nombresEnEquipo(equipo);
    const hayElegibles = tiradaActual.jugadores.some((j) => jugadorElegible(slots, equipo, nombres, j));
    if (rerollsRestantes <= 0 && hayElegibles) return;
    setTiradaActual(getOtroMundial(tiradaActual));
    if (hayElegibles) setRerollsRestantes((r) => r - 1);
  }, [phase, tiradaActual, rerollsRestantes, slots, equipo]);

  const tirar = useCallback(() => {
    if (completo) return;

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
  }, [completo, modo]);

  // Guarda el resultado en BD y acredita monedas. Se llama desde finalizarConCampana
  // DESPUÉS de que el usuario ve la campaña (incluye bonus por desempeño).
  const guardarResultado = useCallback(async (
    res: DraftResultado,
    eq: JugadorSeleccionado[],
    rec: RecompensaDraft,
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
          coins: rec.coins,
          xp: rec.xp,
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

      // No se puede repetir el mismo jugador (p. ej. Garrincha del 58 y del 62).
      const nombres = nombresEnEquipo(equipo);
      if (nombres.has(normNombre(jugador.nombre))) return;

      // Hueco EXACTO de su posición. Si esa posición está llena, no se puede.
      const slotId = slotExactoLibre(slots, equipo, jugador.posicion);
      if (slotId === null) return;

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

      const nuevoEquipo: Equipo = { ...equipo, [slotId]: seleccionado };
      setEquipo(nuevoEquipo);

      if (Object.keys(nuevoEquipo).length >= slots.length) {
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
    [tiradaActual, phase, estilo, equipo, slots, modo, logrosEstado]
  );

  // Llamado desde CampanaScreen cuando el usuario termina de ver la campaña.
  // Calcula el bonus según el resultado, guarda todo y pasa a "resultado".
  const finalizarConCampana = useCallback(async (campana: Campana) => {
    const bonus = calcularBonusCampana(campana);
    setCampanaBonus(bonus);

    if (resultado) {
      const rec = calcularRecompensaDraft(resultado.calificacion, campana);
      setRecompensa(rec);
      const eq = Object.values(equipo).filter(Boolean) as JugadorSeleccionado[];
      await guardarResultado(resultado, eq, rec);
    }

    setPhase("resultado");
  }, [resultado, equipo, guardarResultado]);

  const reiniciar = useCallback(() => {
    setPhase("setup");
    setEquipo({});
    setResultado(null);
    setTiradaActual(null);
    setTiempoRestante(null);
    setGuardando(false);
    setLogrosNuevos([]);
    setRerollsRestantes(REROLLS_INICIALES);
    setCampanaBonus(0);
    setRecompensa(null);
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
      const nombres = nombresEnEquipo(equipo);
      const jugadoresValidos = tiradaActual.jugadores.filter(
        (j) => jugadorElegible(slots, equipo, nombres, j)
      );
      if (jugadoresValidos.length > 0) {
        const elegido = jugadoresValidos[Math.floor(Math.random() * jugadoresValidos.length)];
        seleccionarJugador(elegido.id);
      } else {
        // Esta selección no aporta ningún jugador fichable → redibuja otra
        // (en contrarreloj no hay botones de re-tirada).
        tirar();
      }
    }
  }, [tiempoRestante, modo, tiradaActual, equipo, slots, seleccionarJugador, tirar]);

  // Jugadores fichables de la tirada: solo los que NO están ya en el once y
  // cuya posición exacta tiene hueco. Las opciones de una posición ya cubierta
  // (p. ej. otro delantero centro) desaparecen del panel.
  const jugadoresDisponibles = useMemo(() => {
    if (!tiradaActual) return [];
    const nombres = nombresEnEquipo(equipo);
    return tiradaActual.jugadores
      .filter((j) => jugadorElegible(slots, equipo, nombres, j))
      .map((j) => ({
        ...j,
        seleccion: tiradaActual.seleccion,
        year: tiradaActual.year,
        bandera: tiradaActual.bandera,
      }));
  }, [tiradaActual, equipo, slots]);

  const total = slots.length;
  const completadas = Object.keys(equipo).length;
  const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0;

  // Posiciones SIN hueco exacto disponible (el panel las atenúa y bloquea).
  const posicionesOcupadas = useMemo(
    () => TODAS_POSICIONES.filter((p) => slotExactoLibre(slots, equipo, p) === null),
    [slots, equipo]
  );

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
    slots,
    slotActivo,
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
    recompensa,
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
