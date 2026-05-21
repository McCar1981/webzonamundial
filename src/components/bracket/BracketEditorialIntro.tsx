// src/components/bracket/BracketEditorialIntro.tsx
//
// Intro editorial larga (~900 palabras) que se renderiza al PIE de la página
// /bracket. Sirve dos propósitos:
//   1. AdSense / SEO: subir el contenido editorial de /bracket de ~870 a
//      ~1.800 palabras. Demuestra a Google que la página tiene contenido
//      sustantivo y no es una "página vacía con un widget interactivo".
//   2. SEO long-tail: cubre términos como "predecir bracket Mundial 2026",
//      "cómo funciona el bracket", "qué es un bracket challenge",
//      "estrategia para acertar el bracket", etc.
//
// Renderizado como <article> semántico. Estilos inline siguiendo paleta del
// proyecto (BG dark + dorados).

import Link from "next/link";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const GOLD3 = "#FDE68A";
const TEXT = "#cbd5e1";
const MUTED = "#94a3b8";
const BORDER = "rgba(201,168,76,0.18)";

export default function BracketEditorialIntro() {
  return (
    <section
      aria-labelledby="bracket-editorial"
      style={{
        background: "#060B14",
        padding: "70px 20px 60px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <article
        style={{
          maxWidth: 820,
          margin: "0 auto",
          color: TEXT,
          fontSize: 16,
          lineHeight: 1.75,
        }}
      >
        <div
          style={{
            color: GOLD,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          // Guía del Bracket Challenge
        </div>

        <h2
          id="bracket-editorial"
          style={{
            color: GOLD2,
            fontSize: "clamp(26px, 4vw, 38px)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            margin: "0 0 14px",
          }}
        >
          Cómo construir un bracket ganador para el Mundial 2026
        </h2>

        <p style={{ color: MUTED, fontSize: 14, marginBottom: 28 }}>
          Redacción de ZonaMundial · Actualizado el 21 de mayo de 2026 ·
          Lectura ~6 min
        </p>

        <p style={{ fontSize: 18, color: "#e2e8f0", marginBottom: 22 }}>
          Un bracket es la representación visual del cuadro de un torneo de
          eliminación directa. En el Mundial 2026 se vuelve especialmente
          atractivo porque el nuevo formato de 48 selecciones añade una ronda
          completamente nueva — los dieciseisavos de final — y eso significa
          que los aficionados tendrán que predecir <strong>32 enfrentamientos
          más</strong> que en cualquier Mundial anterior. En total son 104
          partidos para los que puedes intentar acertar resultado, ganador o
          progresión.
        </p>

        <h3 style={h3}>Qué es exactamente un Bracket Challenge</h3>
        <p>
          Un Bracket Challenge es un reto de pronóstico en el que el usuario
          rellena por adelantado el cuadro completo del torneo: quién gana
          cada grupo, quién avanza como segundo, qué terceros se cuelan a
          dieciseisavos, qué partidos se decidirán en penaltis y, sobre todo,
          quién será campeón. Cada acierto otorga puntos, y la dificultad
          escala conforme avanza el torneo: acertar octavos vale más que
          acertar grupos; acertar la final vale el doble. En ZonaMundial el
          bracket es <strong>gratuito y anónimo</strong>: no necesitas
          registrarte para construirlo y guardarlo localmente, aunque sí
          puedes registrarte si quieres competir en el ranking público o
          retar a tus amigos en una liga privada.
        </p>

        <h3 style={h3}>El formato 48 explicado en términos de bracket</h3>
        <p>
          Las 48 selecciones del Mundial 2026 se reparten en{" "}
          <strong>12 grupos de 4 equipos</strong>. Cada grupo juega tres
          partidos durante la fase inicial. Tras esa fase, clasifican{" "}
          <strong>los dos primeros de cada grupo</strong> (24 equipos) más{" "}
          <strong>los ocho mejores terceros</strong>, formando el cuadro de
          32 que disputa los <Link href="/calendario" style={linkGold}>dieciseisavos
          de final</Link>. Este es el cambio más relevante: en 2022 sólo
          jugaban octavos los 16 mejores; ahora primero hay una ronda de
          dieciseisavos, y eso significa más juego, más sorpresas y un
          bracket que se siente como el de la NCAA estadounidense.
        </p>

        <p>
          A partir de dieciseisavos todo es eliminación directa: 16 partidos
          de dieciseisavos → 8 octavos → 4 cuartos → 2 semifinales → 1 partido
          por el tercer puesto y 1 gran final. Si predices bien la posición
          de cada equipo en su grupo, el resto del bracket fluye naturalmente
          porque cada cruce posterior está predefinido por la FIFA. La{" "}
          <Link href="/grupos" style={linkGold}>sección de grupos</Link>{" "}
          detalla cómo se cruzan: por ejemplo, el primero del Grupo A se
          enfrenta en dieciseisavos al tercero clasificado de los grupos C,
          E, F, H o I (según puntos), y así sucesivamente.
        </p>

        <h3 style={h3}>Cinco estrategias que usan los analistas para acertar más</h3>

        <p>
          <strong>1. Pesa la confederación, no solo el ranking FIFA.</strong>{" "}
          Las selecciones europeas y sudamericanas siguen ganando la mayoría
          de duelos de eliminación directa contra rivales de otras
          confederaciones, incluso cuando el ranking FIFA está cerca. En los
          últimos siete Mundiales, todos los campeones han salido de UEFA o
          CONMEBOL.
        </p>

        <p>
          <strong>2. Acepta sorpresas en grupos, no en cuartos.</strong> Las
          fases de grupos producen el 70% de las sorpresas de un Mundial. Si
          quieres maximizar puntos en ZonaMundial, mantén a los favoritos
          clásicos (Argentina, España, Francia, Brasil) en cuartos y deja
          que los segundos de grupo sean las sorpresas (Marruecos 2022,
          Croacia 2018, Costa Rica 2014).
        </p>

        <p>
          <strong>3. Considera la sede.</strong> El Mundial 2026 se juega en
          tres países con climas muy distintos. Atlanta y Dallas en verano
          superan los 35 °C y los 70% de humedad: penaliza a selecciones
          europeas en partidos de la fase final si caen ahí. Por contraste,
          México (CDMX y Guadalajara) está a más de 1.500 metros de altitud
          y favorece a equipos acostumbrados al ritmo lento (Argentina,
          México, Bolivia). Toronto y Vancouver son los más amables para
          europeos.
        </p>

        <p>
          <strong>4. El factor del calendario.</strong> Si una selección
          juega su tercera jornada en Guadalajara y la siguiente ronda en
          Boston o Filadelfia, tiene 4 horas de avión y un cambio de huso
          horario importante. ZonaMundial publica el detalle de viajes y
          descansos de cada selección en la{" "}
          <Link href="/calendario" style={linkGold}>página del calendario</Link>.
        </p>

        <p>
          <strong>5. Recencia más que palmarés.</strong> El historial mundial
          pesa, pero el estado de forma de los últimos 6 meses pesa más. En
          ZonaMundial puedes consultar el rendimiento reciente de cada
          selección (resultados, lesiones, convocatoria probable) en la ficha
          individual desde la{" "}
          <Link href="/selecciones" style={linkGold}>sección de selecciones</Link>.
        </p>

        <h3 style={h3}>Cómo usar el Bracket Challenge de ZonaMundial</h3>
        <p>
          La herramienta está pensada para que cualquier aficionado, con o
          sin experiencia previa, pueda rellenar su pronóstico en menos de 15
          minutos. Empiezas por la fase de grupos: para cada partido,
          seleccionas un ganador o un empate (los empates se permiten solo en
          la fase de grupos, en eliminación directa el sistema te obligará a
          elegir lado). Al completar los seis partidos de cada grupo, el
          sistema calcula automáticamente la tabla y propone los dos
          primeros como clasificados.
        </p>

        <p>
          Después llegan los dieciseisavos, octavos, cuartos, semifinales y
          la final. En cada cruce el bracket te muestra los dos equipos que
          predijiste y eliges quién pasa. Puedes deshacer cualquier elección
          con el botón "Atrás" del HUD superior. Cuando hayas terminado, el
          sistema te ofrece guardar tu bracket con un nombre de usuario para
          competir en el ranking global, o simplemente compartirlo en redes
          como una imagen. Toda esta lógica funciona{" "}
          <strong>sin necesidad de registro</strong> — el bracket se guarda
          en el almacenamiento local de tu navegador. Si te registras, queda
          también respaldado en tu cuenta y puedes acceder desde cualquier
          dispositivo.
        </p>

        <h3 style={h3}>Pide análisis al Coach IA en partidos clave</h3>
        <p>
          Cada partido del bracket cuenta con un botón "Pedir análisis al
          Coach IA". Esa función llama a un modelo Claude Sonnet 4.5 que cruza
          datos reales de api-football (forma reciente, lesiones, head-to-head
          histórico, cuotas implícitas del mercado) y devuelve un análisis
          breve — máximo 150 caracteres — más cuatro factores clave y un
          jugador a vigilar. Es especialmente útil para los duelos cerrados:
          si dudas entre dejar pasar a España o Uruguay en el Grupo H, el
          Coach IA te dará una recomendación razonada en menos de 25
          segundos. No es infalible, pero es un buen segundo punto de vista
          antes de marcar tu predicción definitiva.
        </p>

        <p>
          Si tienes curiosidad por los Mundiales anteriores y quieres
          contextualizar tu bracket, la sección de{" "}
          <Link href="/historia/campeones" style={linkGold}>
            historia de campeones
          </Link>{" "}
          repasa todos los Mundiales desde Uruguay 1930 hasta Argentina 2022
          con goleadores, finales y datos de cada edición. Aprender del pasado
          ayuda a calibrar las expectativas: solo ocho selecciones han ganado
          un Mundial en 22 ediciones, y los favoritos previos ganan menos de
          la mitad de las veces.
        </p>

        <div
          style={{
            marginTop: 30,
            padding: "20px 22px",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            background:
              "linear-gradient(180deg, rgba(201,168,76,0.04), rgba(11,24,37,0.4))",
          }}
        >
          <p
            style={{
              color: GOLD3,
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 8,
              margin: 0,
            }}
          >
            // Consejo final
          </p>
          <p style={{ margin: 0, fontSize: 15, color: TEXT }}>
            No hay un bracket perfecto. Incluso los analistas más respetados
            fallan entre el 35% y el 45% de las predicciones de Mundial.
            Diviértete construyendo el tuyo, comparte el resultado con tus
            amigos, y vuelve después del Mundial para ver cuántos puntos
            sumaste. Lo importante es vivir el torneo con la emoción de
            "tengo a Marruecos en cuartos" o "el campeón es Brasil porque
            confío en Ancelotti".
          </p>
        </div>
      </article>
    </section>
  );
}

const h3 = {
  color: GOLD3,
  fontSize: "clamp(20px, 3vw, 25px)",
  fontWeight: 800,
  letterSpacing: "-0.01em",
  marginTop: 32,
  marginBottom: 12,
  lineHeight: 1.25,
};

const linkGold = {
  color: GOLD2,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  textDecorationThickness: 1,
};
