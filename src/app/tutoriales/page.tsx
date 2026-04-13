"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useLanguage } from "@/i18n/LanguageContext";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a", DARK = "#4a5570";

const MODULE_COLORS: Record<string, string> = {
  Fantasy: "#3b82f6",
  Predicciones: "#ef4444",
  Trivia: "#a855f7",
  "IA Coach": "#22c55e",
  "Modo Carrera": "#ec4899",
  "Ligas Privadas": "#14b8a6",
  Streaming: "#f97316",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Fácil: "#22c55e",
  Medio: "#f59e0b",
  Avanzado: "#ef4444",
};

const MODULES = [
  { id: "all", label: "Todos", color: GOLD },
  { id: "Fantasy", label: "Fantasy", color: MODULE_COLORS["Fantasy"] },
  { id: "Predicciones", label: "Predicciones", color: MODULE_COLORS["Predicciones"] },
  { id: "Trivia", label: "Trivia", color: MODULE_COLORS["Trivia"] },
  { id: "IA Coach", label: "IA Coach", color: MODULE_COLORS["IA Coach"] },
  { id: "Modo Carrera", label: "Modo Carrera", color: MODULE_COLORS["Modo Carrera"] },
  { id: "Ligas Privadas", label: "Ligas Privadas", color: MODULE_COLORS["Ligas Privadas"] },
  { id: "Streaming", label: "Streaming", color: MODULE_COLORS["Streaming"] },
];

type Step = { title: string; description: string };
type Tutorial = {
  id: number;
  title: string;
  excerpt: string;
  module: string;
  difficulty: "Fácil" | "Medio" | "Avanzado";
  duration: string;
  steps: number;
  featured: boolean;
  tips: string[];
  stepDetails: Step[];
  img: string;
};

const TUTORIALS: Tutorial[] = [
  {
    id: 1,
    title: "Cómo crear tu equipo Fantasy perfecto",
    excerpt: "Aprende a construir un equipo ganador desde cero: selección de jugadores, gestión del presupuesto y estrategias de puntuación.",
    module: "Fantasy",
    difficulty: "Fácil",
    duration: "5 min",
    steps: 6,
    featured: true,
    img: "linear-gradient(135deg,#3b82f620,#0F1D32)",
    tips: [
      "Elige un portero de una selección que llegue lejos para acumular puntos por partidos disputados.",
      "No metas todos los presupuestos en un solo crack; el equilibrio es la clave.",
      "Revisa las lesiones 24h antes de cada jornada para hacer cambios a tiempo.",
    ],
    stepDetails: [
      { title: "Entra en el módulo Fantasy", description: "Desde el menú principal pulsa 'Fantasy' y luego 'Crear equipo'. Si es tu primera vez, el asistente te dará la bienvenida con una breve animación." },
      { title: "Elige tu formación táctica", description: "Selecciona entre 4-3-3, 4-4-2, 3-5-2 u otras formaciones. Cada esquema condiciona cuántos delanteros, centrocampistas y defensas puedes alinear." },
      { title: "Gestiona tu presupuesto", description: "Tienes 100 créditos para gastar. La barra superior muestra cuánto llevas gastado. Los jugadores más cotizados están marcados con una corona dorada." },
      { title: "Selecciona portero y defensa", description: "Empieza por la zaga. Busca defensas de selecciones sólidas que den pocos goles: Alemania, Italia o Marruecos son buenas opciones." },
      { title: "Completa el mediocampo y el ataque", description: "Para los delanteros busca máximos goleadores históricos y con cuotas altas. Jugadores como Kane, Benzema o Mbappé dan muchos puntos por gol." },
      { title: "Confirma y nombra tu equipo", description: "Dale un nombre creativo a tu equipo, elige un escudo y pulsa 'Confirmar alineación'. Ya eres parte del Fantasy del Mundial 2026." },
    ],
  },
  {
    id: 2,
    title: "Domina las Predicciones de resultado exacto",
    excerpt: "Las predicciones exactas multiplican tu puntuación. Descubre cómo analizar partidos, qué datos mirar y cuándo apostar por la sorpresa.",
    module: "Predicciones",
    difficulty: "Medio",
    duration: "7 min",
    steps: 5,
    featured: true,
    img: "linear-gradient(135deg,#ef444420,#0F1D32)",
    tips: [
      "Los partidos de fase de grupos entre favoritos y débiles tienden a acabar 2-0 o 3-0.",
      "Guarda tus predicciones más arriesgadas para la fase eliminatoria; los puntos se multiplican.",
      "Activa las notificaciones para que ZonaMundial te avise cuando una predicción esté cerca de cerrarse.",
    ],
    stepDetails: [
      { title: "Accede al panel de Predicciones", description: "Ve a la sección 'Predicciones' desde el menú. Verás el calendario de partidos con un semáforo: verde (abierto), naranja (cierra pronto), rojo (cerrado)." },
      { title: "Analiza las estadísticas previas", description: "Pulsa sobre un partido para ver el historial de enfrentamientos, la racha de resultados recientes y las estadísticas de goles por partido de cada selección." },
      { title: "Introduce el marcador exacto", description: "Usa los botones +/- para ajustar el marcador de cada equipo. El sistema te muestra en tiempo real cuántos puntos ganarías si aciertas." },
      { title: "Entiende el sistema de puntos", description: "Resultado correcto: 2 pts. Diferencia de goles correcta: 3 pts. Marcador exacto: 6 pts. Bonus de fase eliminatoria: ×2. Planifica cuándo arriesgarte." },
      { title: "Confirma antes del cierre", description: "Las predicciones cierran 15 minutos antes del pitido inicial. Recibirás un push de recordatorio si tienes partidos sin predecir." },
    ],
  },
  {
    id: 3,
    title: "Estrategias para ganar más puntos en Trivia",
    excerpt: "La Trivia del Mundial pone a prueba tu conocimiento. Con estas técnicas mejorarás tu racha, subirás en el ranking y desbloquearás logros exclusivos.",
    module: "Trivia",
    difficulty: "Fácil",
    duration: "4 min",
    steps: 5,
    featured: true,
    img: "linear-gradient(135deg,#a855f720,#0F1D32)",
    tips: [
      "Usa el comodín 'Elimina 2 opciones' solo en preguntas de historia o estadísticas donde tengas dudas.",
      "Las rachas de respuestas correctas multiplican por 1.5x los puntos a partir de la 5ª consecutiva.",
      "Juega el modo 'Relámpago' por las noches; hay menos competencia y el matchmaking es más fácil.",
    ],
    stepDetails: [
      { title: "Elige el modo de juego correcto", description: "ZonaMundial ofrece Trivia Rápida (10 preguntas, 30s cada una), Trivia Mundial (30 preguntas temáticas) y Duelo 1v1. Para principiantes recomendamos Rápida." },
      { title: "Conoce las categorías de preguntas", description: "Historia del Mundial, Estadísticas de jugadores, Sedes y estadios, Reglas del juego y ZonaMundial (sobre la app). Estudia las que peor controles." },
      { title: "Gestiona el tiempo por respuesta", description: "Tienes 30 segundos. Si no sabes la respuesta, usa el comodín en los primeros 10 segundos para no perder puntos por tiempo. Las respuestas rápidas dan bonus." },
      { title: "Aprovecha las rachas", description: "A partir de 3 respuestas seguidas correctas entras en 'Racha Caliente': los puntos se multiplican. Prioriza no romper la racha sobre usar comodines." },
      { title: "Desafía a amigos para puntos extra", description: "Los duelos 1v1 dan el doble de puntos que el modo individual. Reta a tus contactos desde el ranking semanal o comparte tu enlace de desafío." },
    ],
  },
  {
    id: 4,
    title: "Cómo sacar el máximo al IA Coach",
    excerpt: "El asistente de inteligencia artificial de ZonaMundial analiza tu rendimiento y te da consejos personalizados. Aprende a usarlo eficazmente.",
    module: "IA Coach",
    difficulty: "Medio",
    duration: "6 min",
    steps: 5,
    featured: false,
    img: "linear-gradient(135deg,#22c55e20,#0F1D32)",
    tips: [
      "Habla con el IA Coach antes de cada jornada para recibir sugerencias de transferencias en Fantasy.",
      "Pídele que analice tu historial de predicciones para identificar patrones de error.",
      "Cuanto más interactúes, más preciso será su modelo predictivo sobre tu estilo de juego.",
    ],
    stepDetails: [
      { title: "Activa el IA Coach desde tu perfil", description: "Ve a 'Mi perfil' → 'IA Coach'. En tu primer uso, el asistente recopila datos de tus últimas jornadas para calibrar el modelo inicial." },
      { title: "Explora el dashboard de análisis", description: "El panel muestra tu puntuación media, tus módulos más fuertes y débiles, y un gráfico de evolución semanal. Son los datos que el IA usa para asesorarte." },
      { title: "Consulta recomendaciones automáticas", description: "Cada lunes el IA Coach genera un informe con 3-5 acciones recomendadas: transferencias, predicciones de alto valor y preguntas de trivia para repasar." },
      { title: "Usa el chat libre", description: "Puedes hacerle preguntas en lenguaje natural: '¿Debería vender a Musiala?', '¿Cuál es el mejor momento para hacer la predicción del partido España-Argentina?' El IA responde con datos reales." },
      { title: "Activa las alertas inteligentes", description: "En 'Configuración del Coach' activa las notificaciones push. Recibirás avisos automáticos cuando un jugador de tu Fantasy sube/baja de precio o hay una predicción de alto valor disponible." },
    ],
  },
  {
    id: 5,
    title: "Crear una Liga Privada con amigos",
    excerpt: "Organiza tu propio torneo privado del Mundial. Invita a amigos, personaliza las reglas y sigue el marcador en tiempo real durante todo el torneo.",
    module: "Ligas Privadas",
    difficulty: "Fácil",
    duration: "3 min",
    steps: 6,
    featured: false,
    img: "linear-gradient(135deg,#14b8a620,#0F1D32)",
    tips: [
      "Crea la liga antes de que empiece el Mundial para dar tiempo a todos de inscribirse.",
      "Activa el modo 'Sorpresa' para que los puntos sean ocultos hasta el final de cada jornada.",
      "Usa el chat de liga para provocar a los demás; la rivalidad amistosa sube la motivación.",
    ],
    stepDetails: [
      { title: "Accede a Ligas Privadas", description: "En el menú principal toca 'Ligas' → 'Crear nueva liga'. Necesitas tener al menos 2 participantes (puedes ser tú el organizador)." },
      { title: "Configura el nombre y las reglas", description: "Pon un nombre a tu liga (máx. 30 caracteres), elige el avatar de grupo y selecciona qué módulos cuentan para la puntuación: Fantasy, Predicciones, Trivia o los tres." },
      { title: "Ajusta los multiplicadores", description: "Como administrador puedes dar más peso a ciertos módulos. Ejemplo: Predicciones ×2 y Fantasy ×1 para ligas más intensas en análisis táctico." },
      { title: "Comparte el código de invitación", description: "Obtendrás un código de 6 dígitos y un enlace directo. Compártelo por WhatsApp, Telegram o cualquier red social. Los amigos se unen en segundos." },
      { title: "Sigue el ranking en tiempo real", description: "Durante el Mundial el ranking se actualiza cada 5 minutos. Las posiciones suben y bajan según los goles, aciertos y respuestas de cada jornada." },
      { title: "Celebra al campeón", description: "Al final del torneo el ganador recibe un trofeo animado y una insignia exclusiva de campeón de liga que aparece en su perfil público." },
    ],
  },
  {
    id: 6,
    title: "Ver partidos en Streaming dentro de ZonaMundial",
    excerpt: "ZonaMundial integra un reproductor de streaming con estadísticas en vivo, comentarios en tiempo real y sincronización con tus módulos activos.",
    module: "Streaming",
    difficulty: "Fácil",
    duration: "4 min",
    steps: 5,
    featured: false,
    img: "linear-gradient(135deg,#f9731620,#0F1D32)",
    tips: [
      "Activa el modo 'Picture-in-Picture' para seguir el partido mientras navegas por Fantasy o Predicciones.",
      "Usa la vista multiscreeen para ver hasta 2 partidos simultáneos en pantalla dividida.",
      "Conecta el audio al sistema de sonido de tu TV mediante AirPlay o Chromecast desde la app.",
    ],
    stepDetails: [
      { title: "Verifica tu suscripción de streaming", description: "El streaming requiere la cuenta ZonaMundial Premium o ZonaMundial+. Ve a 'Streaming' en el menú; si no tienes acceso verás el botón de actualización de plan." },
      { title: "Selecciona el partido a seguir", description: "En la pantalla de Streaming aparece el calendario del día. Los partidos disponibles muestran el ícono de play. Los que están en vivo tienen un indicador rojo pulsante." },
      { title: "Personaliza el panel lateral", description: "Mientras ves el partido, el panel derecho muestra estadísticas en vivo (posesión, tiros, corners), el marcador de Fantasy actualizado y el chat de tu liga activa." },
      { title: "Activa los eventos en vivo", description: "Con 'Eventos en Vivo' activados, ZonaMundial te avisa con vibración cuando hay gol, tarjeta roja o penalti. Cada evento se sincroniza automáticamente con tus predicciones activas." },
      { title: "Usa los controles avanzados", description: "El reproductor soporta retrasos de 30 segundos (para evitar spoilers en las notificaciones), subtítulos en 5 idiomas y selección de calidad: 480p, 720p y 1080p según tu conexión." },
    ],
  },
  {
    id: 7,
    title: "Modo Carrera: construye tu legado en el Mundial",
    excerpt: "El Modo Carrera es la experiencia más profunda de ZonaMundial. Gestiona una selección a lo largo del torneo, toma decisiones tácticas y deja huella.",
    module: "Modo Carrera",
    difficulty: "Avanzado",
    duration: "10 min",
    steps: 6,
    featured: false,
    img: "linear-gradient(135deg,#ec489920,#0F1D32)",
    tips: [
      "Los jugadores acumulan fatiga si juegas siempre con la misma alineación; rota en la fase de grupos.",
      "Las decisiones de rueda de prensa afectan a la moral del equipo. Sé coherente con tus respuestas.",
      "Guarda un punto de guardado antes de los partidos de eliminatoria por si necesitas replantear la táctica.",
    ],
    stepDetails: [
      { title: "Elige tu selección y dificultad", description: "Puedes dirigir cualquiera de las 48 selecciones participantes. La dificultad Legendaria desbloquea logros exclusivos pero las simulaciones son más realistas." },
      { title: "Gestiona la plantilla y el cuerpo técnico", description: "Asigna roles a cada jugador (capitán, lanzador de penaltis, saques de esquina). El staff técnico influye en la preparación física y táctica entre partidos." },
      { title: "Prepara cada partido con el editor táctico", description: "Antes de cada encuentro accedes a un análisis del rival con sus fortalezas y debilidades. Adapta tu sistema: presión alta, posesión o contragolpe." },
      { title: "Simula o juega los partidos", description: "Puedes simular los partidos automáticamente o tomar el control directo con el motor de simulación interactivo. Las decisiones de cambios en directo afectan el resultado." },
      { title: "Gestiona la moral y los medios", description: "Tras cada partido responde preguntas de rueda de prensa. Las respuestas afectan a la moral del equipo, la confianza individual de jugadores y la cobertura mediática." },
      { title: "Avanza por las eliminatorias", description: "Cada fase desbloquea contenido nuevo: jugadores históricos como mentores, estadísticas comparativas con selecciones legendarias y documentales dentro del juego." },
    ],
  },
  {
    id: 8,
    title: "Transferencias en Fantasy: cuándo y cómo hacerlas",
    excerpt: "El mercado de transferencias es donde se ganan y pierden ligas. Aprende a identificar jugadores en alza, el momento óptimo para comprar y vender.",
    module: "Fantasy",
    difficulty: "Avanzado",
    duration: "8 min",
    steps: 5,
    featured: false,
    img: "linear-gradient(135deg,#3b82f620,#0F1D32)",
    tips: [
      "Compra jugadores 48h antes de que su selección juegue un partido fácil: el precio sube con el rendimiento.",
      "El precio máximo de un jugador se actualiza cada 12 horas. Vende en picos, no cuando ya bajó.",
      "Usa el filtro 'En forma' del mercado para ver quién lleva 3+ partidos con buenas actuaciones.",
    ],
    stepDetails: [
      { title: "Accede al mercado de transferencias", description: "Desde tu equipo Fantasy pulsa 'Mercado'. Tienes disponibles los filtros: posición, precio, selección, rendimiento y valoración del IA Coach." },
      { title: "Analiza las gráficas de precio", description: "Cada jugador tiene un historial de precio en los últimos 14 días. Busca líneas ascendentes sostenidas, no picos puntuales que pueden ser temporales." },
      { title: "Calcula el coste de oportunidad", description: "Antes de vender compara: ¿cuántos puntos me daría mantener este jugador vs. el que quiero comprar? El panel de comparación lado a lado facilita esta decisión." },
      { title: "Usa el banco de reservas estratégicamente", description: "Mantén 1-2 jugadores en el banco que cubran posiciones críticas por si hay lesiones de última hora. El banco también puntúa si los titulares no juegan." },
      { title: "Planifica el comodín de transferencias", description: "Una vez por torneo puedes hacer transferencias ilimitadas en una jornada. Guárdalo para la víspera de cuartos o semis, cuando las bajas y lesiones hacen estragos." },
    ],
  },
  {
    id: 9,
    title: "Predicciones avanzadas: bonificaciones y multiplicadores",
    excerpt: "Más allá del resultado exacto, ZonaMundial ofrece predicciones especiales con multiplicadores que pueden triplicar tu puntuación en una jornada.",
    module: "Predicciones",
    difficulty: "Avanzado",
    duration: "9 min",
    steps: 5,
    featured: false,
    img: "linear-gradient(135deg,#ef444420,#0F1D32)",
    tips: [
      "Las predicciones de primer goleador del torneo dan 50 puntos si aciertas; vale la pena arriesgar.",
      "En empates el marcador exacto es más probable en partidos entre selecciones de nivel similar.",
      "Activa el 'Modo Experto' en ajustes para ver las probabilidades implícitas de cada resultado.",
    ],
    stepDetails: [
      { title: "Descubre las predicciones especiales", description: "Además de los marcadores normales, cada jornada hay predicciones especiales: primer goleador del partido, equipo que saca la primera tarjeta o minuto del primer gol." },
      { title: "Entiende los multiplicadores de fase", description: "Fase de grupos: ×1. Octavos: ×1.5. Cuartos: ×2. Semis: ×2.5. Final: ×3. Planifica guardar tus predicciones más seguras para las fases avanzadas." },
      { title: "Usa la predicción de torneo completo", description: "Antes del inicio puedes predecir el campeón, subcampeón, máximo goleador y la selección menos goleada. Estos mercados dan puntos masivos si aciertas." },
      { title: "Activa el modo 'Doble o nada'", description: "Una vez por eliminatoria puedes activar 'Doble o nada' en una predicción: si aciertas el marcador exacto ganas el doble; si fallas pierdes los puntos de esa predicción." },
      { title: "Consulta el historial de aciertos", description: "En tu perfil accede a 'Estadísticas de predicciones' para ver tu porcentaje de acierto por tipo de predicción. Esto te ayuda a identificar en qué mercados eres más fiable." },
    ],
  },
  {
    id: 10,
    title: "Trivia de Historia: prepárate con la Guía del Mundial",
    excerpt: "Las preguntas históricas son las más difíciles y las que más puntos dan. Esta guía de estudio te prepara con los datos clave de todos los Mundiales.",
    module: "Trivia",
    difficulty: "Avanzado",
    duration: "12 min",
    steps: 4,
    featured: false,
    img: "linear-gradient(135deg,#a855f720,#0F1D32)",
    tips: [
      "Los años y países anfitriones son la pregunta más frecuente: memoriza la lista del 1930 al 2022.",
      "Los récords individuales (goles, partidos, asistencias) salen mucho. Pelé, Miroslav Klose y Ronaldo C. son clave.",
      "Las finales más recordadas (1950, 1966, 1986, 2014, 2022) tienen preguntas dedicadas casi siempre.",
    ],
    stepDetails: [
      { title: "Accede a la Guía del Mundial en la app", description: "En el módulo Trivia hay una sección 'Estudia y entrena' con la guía oficial de ZonaMundial: 22 ediciones resumidas, estadísticas históricas y galería de momentos icónicos." },
      { title: "Haz los tests de práctica por era", description: "La guía divide la historia en 4 eras: Clásica (1930-1966), Moderna (1970-1990), Global (1994-2010) y Contemporánea (2014-2022). Practica las que menos controles." },
      { title: "Usa las fichas de memoria rápida", description: "Las 'Flashcards' de la app muestran un dato (campeón, sede, máximo goleador) y tú confirmas si lo sabías. El sistema repite las que fallas con más frecuencia." },
      { title: "Reta al IA Coach con preguntas de historia", description: "Puedes pedirle al IA Coach que te haga un examen simulado de historia. Genera 10 preguntas personalizadas según tu historial de fallos para un repaso eficiente." },
    ],
  },
  {
    id: 11,
    title: "Personaliza tu perfil y sube en el ranking global",
    excerpt: "Tu perfil en ZonaMundial es tu carta de presentación. Aprende a personalizarlo, ganar insignias de prestigio y escalar en el ranking mundial.",
    module: "IA Coach",
    difficulty: "Fácil",
    duration: "3 min",
    steps: 4,
    featured: false,
    img: "linear-gradient(135deg,#22c55e20,#0F1D32)",
    tips: [
      "Completa el perfil al 100% desbloquea la insignia 'Fan Completo' que da +50 puntos de bienvenida.",
      "Conecta tus redes sociales para importar amigos y unirte a ligas privadas de tu entorno.",
      "Revisa el ranking semanal cada lunes; hay premios sorpresa para los top 100 de la semana.",
    ],
    stepDetails: [
      { title: "Configura tu avatar y selección favorita", description: "En 'Mi perfil' personaliza tu avatar (foto o avatar animado), nombre de usuario, selección favorita y el eslogan de tu perfil público. El avatar anima con cada logro." },
      { title: "Conecta módulos al ranking global", description: "El ranking global acumula puntos de todos los módulos: Fantasy (30%), Predicciones (30%), Trivia (25%) e Interacción social (15%). Cada módulo activo suma." },
      { title: "Desbloquea insignias y logros", description: "Hay 48 insignias en total: por módulo, por racha, por predicciones acertadas y especiales del Mundial. Cada insignia desbloqueada mejora tu visibilidad en el ranking." },
      { title: "Sigue a otros usuarios y copia estrategias", description: "Puedes seguir a usuarios del top 100 y ver (con permiso) sus equipos Fantasy y estrategias de predicción. Aprende de los mejores para mejorar tu propia clasificación." },
    ],
  },
];

function AnimatedBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const color = DIFFICULTY_COLORS[difficulty] || GOLD;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold"
      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
      {difficulty}
    </span>
  );
}

function StepsIcon({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-[#6a7a9a]">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {count} pasos
    </span>
  );
}

function FeaturedTutorialCard({ tutorial, onClick, index }: { tutorial: Tutorial; onClick: (t: Tutorial) => void; index: number }) {
  const modColor = MODULE_COLORS[tutorial.module] || GOLD;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { y: 60, opacity: 0, scale: 0.95 },
      {
        y: 0, opacity: 1, scale: 1, duration: 0.8, delay: index * 0.15, ease: "power3.out",
        scrollTrigger: { trigger: cardRef.current, start: "top 85%", once: true },
      }
    );
  }, [index]);

  return (
    <div ref={cardRef} onClick={() => onClick(tutorial)} className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-3xl border border-white/5 hover:border-[var(--mod-color)]/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
        style={{ "--mod-color": modColor } as React.CSSProperties}>
        <div className="absolute inset-0" style={{ background: tutorial.img }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--mod-color)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative p-8 min-h-[280px] flex flex-col justify-end">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <AnimatedBadge color={modColor}>{tutorial.module}</AnimatedBadge>
            <DifficultyBadge difficulty={tutorial.difficulty} />
            <span className="ml-auto text-xs text-[#6a7a9a] flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {tutorial.duration}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-3 group-hover:text-[#C9A84C] transition-colors leading-tight">{tutorial.title}</h3>
          <p className="text-sm text-[#8a94b0] mb-4 line-clamp-2">{tutorial.excerpt}</p>
          <div className="flex items-center gap-3 text-xs text-[#6a7a9a]">
            <StepsIcon count={tutorial.steps} />
            <span className="w-1 h-1 rounded-full bg-[#6a7a9a]" />
            <span className="text-[#c9a84c] font-semibold group-hover:underline">Ver tutorial →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TutorialCard({ tutorial, onClick, index }: { tutorial: Tutorial; onClick: (t: Tutorial) => void; index: number }) {
  const modColor = MODULE_COLORS[tutorial.module] || GOLD;
  const cardRef = useRef<HTMLDivElement>(null);
  const [hov, setHov] = useState(false);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.6, delay: index * 0.08, ease: "power2.out",
        scrollTrigger: { trigger: cardRef.current, start: "top 90%", once: true },
      }
    );
  }, [index]);

  return (
    <div ref={cardRef} onClick={() => onClick(tutorial)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="group cursor-pointer">
      <div className="relative p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3"
        style={{ background: hov ? `${modColor}08` : BG2, borderColor: hov ? `${modColor}40` : "rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold"
            style={{ background: `${modColor}15`, color: modColor }}>{tutorial.module}</span>
          <DifficultyBadge difficulty={tutorial.difficulty} />
          <span className="text-[10px] text-[#4a5570] ml-auto flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {tutorial.duration}
          </span>
        </div>
        <h3 className="text-base font-bold transition-colors leading-snug"
          style={{ color: hov ? GOLD : "#fff" }}>{tutorial.title}</h3>
        <p className="text-xs text-[#6a7a9a] line-clamp-2">{tutorial.excerpt}</p>
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <StepsIcon count={tutorial.steps} />
          <span className="text-[10px] font-semibold transition-colors"
            style={{ color: hov ? GOLD : DIM }}>Abrir →</span>
        </div>
      </div>
    </div>
  );
}

function TutorialModal({ tutorial, onClose }: { tutorial: Tutorial; onClose: () => void }) {
  const modColor = MODULE_COLORS[tutorial.module] || GOLD;
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) return;
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
    gsap.fromTo(panelRef.current,
      { y: 60, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" }
    );
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = () => {
    if (!overlayRef.current || !panelRef.current) { onClose(); return; }
    gsap.to(panelRef.current, { y: 40, opacity: 0, scale: 0.96, duration: 0.3, ease: "power2.in" });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: "power2.in", onComplete: onClose });
  };

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(6,11,20,0.85)", backdropFilter: "blur(10px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}>
      <div ref={panelRef} className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/8"
        style={{ background: BG2 }}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 pt-6 pb-4 border-b border-white/5"
          style={{ background: BG2, backgroundImage: `linear-gradient(135deg,${modColor}10,transparent)` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <AnimatedBadge color={modColor}>{tutorial.module}</AnimatedBadge>
                <DifficultyBadge difficulty={tutorial.difficulty} />
                <span className="text-xs text-[#6a7a9a] flex items-center gap-1 ml-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {tutorial.duration}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold leading-tight text-white">{tutorial.title}</h2>
            </div>
            <button onClick={handleClose}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-[#8a94b0] mt-2 leading-relaxed">{tutorial.excerpt}</p>
        </div>

        <div className="px-6 py-6 flex flex-col gap-8">
          {/* Steps */}
          <div>
            <h3 className="text-xs font-bold tracking-wider uppercase text-[#6a7a9a] mb-5">
              Pasos — {tutorial.steps} en total
            </h3>
            <div className="flex flex-col gap-4">
              {tutorial.stepDetails.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                      style={{ background: `${modColor}20`, color: modColor, border: `2px solid ${modColor}40` }}>
                      {i + 1}
                    </div>
                    {i < tutorial.stepDetails.length - 1 && (
                      <div className="w-px flex-1 mt-2" style={{ background: `${modColor}20`, minHeight: "20px" }} />
                    )}
                  </div>
                  <div className="pb-4 flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-white mb-1.5">{step.title}</h4>
                    <p className="text-xs text-[#8a94b0] leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="p-5 rounded-2xl border"
            style={{ background: `${GOLD}08`, borderColor: `${GOLD}25` }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base"></span>
              <h3 className="text-sm font-bold" style={{ color: GOLD }}>Consejos y trucos</h3>
            </div>
            <ul className="flex flex-col gap-3">
              {tutorial.tips.map((tip, i) => (
                <li key={i} className="flex gap-3 text-xs text-[#8a94b0] leading-relaxed">
                  <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background: `${GOLD}20`, color: GOLD }}>
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="p-6 rounded-2xl border text-center"
            style={{ background: `${modColor}08`, borderColor: `${modColor}25` }}>
            <p className="text-sm text-[#8a94b0] mb-4">¿Listo para poner en práctica lo aprendido?</p>
            <Link href="/registro"
              className="inline-block px-8 py-3 rounded-xl font-bold text-sm transition-all hover:shadow-lg"
              style={{ background: `linear-gradient(to right,${modColor},${modColor}cc)`, color: "#060B14", boxShadow: `0 0 0 0 ${modColor}00` }}
              onClick={handleClose}>
              Empieza ahora gratis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TutorialesPage() {
  const { t } = useLanguage(); const tT = t.tutorialesPage;
  const [module, setModule] = useState("all");
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const modulesRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const filtered = module === "all" ? TUTORIALS : TUTORIALS.filter(t => t.module === module);
  const featured = filtered.filter(t => t.featured);
  const regular = filtered.filter(t => !t.featured);

  useEffect(() => {
    if (!heroRef.current) return;
    gsap.fromTo(heroRef.current.children,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    );
  }, []);

  useEffect(() => {
    if (!modulesRef.current) return;
    gsap.fromTo(modulesRef.current.children,
      { y: 20, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out",
        scrollTrigger: { trigger: modulesRef.current, start: "top 90%", once: true },
      }
    );
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;
    gsap.fromTo(statsRef.current.children,
      { y: 30, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out",
        scrollTrigger: { trigger: statsRef.current, start: "top 88%", once: true },
      }
    );
  }, []);

  const totalModules = Object.keys(MODULE_COLORS).length;
  const totalTutorials = TUTORIALS.length;
  const easyCount = TUTORIALS.filter(t => t.difficulty === "Fácil").length;

  return (
    <div className="min-h-screen" style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 pt-0 pb-12 sm:pb-16">

        {/* Hero */}
        <div ref={heroRef} className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse" />
            <span className="text-[#c9a84c] text-xs font-bold tracking-wider uppercase">{tT.badge}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight">
            {tT.title1}<br />
            <span className="bg-gradient-to-r from-[#c9a84c] via-[#e8d48b] to-[#c9a84c] bg-clip-text text-transparent">
              {tT.title2}
            </span>
          </h1>
          <p className="text-lg text-[#8a94b0] max-w-xl leading-relaxed">
            {tT.subtitle}
          </p>
        </div>

        {/* Stats rápidos */}
        <div ref={statsRef} className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: tT.statTutoriales, value: totalTutorials, color: GOLD },
            { label: tT.statModulos, value: totalModules, color: "#3b82f6" },
            { label: tT.statFacil, value: easyCount, color: "#22c55e" },
          ].map((s) => (
            <div key={s.label} className="p-4 sm:p-5 rounded-2xl border border-white/5 text-center"
              style={{ background: BG2 }}>
              <div className="text-2xl sm:text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] sm:text-xs text-[#6a7a9a] font-semibold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros por módulo */}
        <div ref={modulesRef} className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {MODULES.map(m => (
            <button key={m.id} onClick={() => setModule(m.id)}
              className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300"
              style={{
                background: module === m.id ? `${m.color}15` : "transparent",
                border: `1px solid ${module === m.id ? `${m.color}40` : "rgba(255,255,255,0.05)"}`,
                color: module === m.id ? m.color : DIM,
              }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Featured tutorials */}
        {featured.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
            {featured.map((t, i) => (
              <FeaturedTutorialCard key={t.id} tutorial={t} onClick={setSelectedTutorial} index={i} />
            ))}
          </div>
        )}

        {/* Separador */}
        {featured.length > 0 && regular.length > 0 && (
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs font-bold tracking-wider uppercase text-[#4a5570]">Todos los tutoriales</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
        )}

        {/* Grid regular */}
        {regular.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {regular.map((t, i) => (
              <TutorialCard key={t.id} tutorial={t} onClick={setSelectedTutorial} index={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-[#6a7a9a]">
            No hay tutoriales en este módulo aún.
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedTutorial && (
        <TutorialModal tutorial={selectedTutorial} onClose={() => setSelectedTutorial(null)} />
      )}
    </div>
  );
}
