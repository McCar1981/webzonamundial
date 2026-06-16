import type { Metadata } from "next";
import Link from "next/link";

const BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

export const metadata: Metadata = {
  title: "Bases del Gran Premio · ZonaMundial",
  description:
    "Bases legales del Gran Premio de ZonaMundial: concurso de habilidad por tasa de acierto, participación gratuita y premio financiado por el patrocinador.",
};

export default function BasesGranPremioPage() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "80px 20px 60px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/" style={{ color: GOLD, fontSize: 13, textDecoration: "none", opacity: 0.7 }}>
          ← Volver al inicio
        </Link>

        <h1 style={{ color: GOLD2, fontSize: 32, fontWeight: 800, margin: "24px 0 8px", letterSpacing: "-0.5px" }}>
          Bases del Gran Premio
        </h1>
        <p style={{ color: DIM, fontSize: 13, marginBottom: 40 }}>
          Última actualización: Junio 2026 · Concurso de habilidad de participación gratuita
        </p>

        <Section title="1. Organizador">
          <p>El presente concurso (en adelante, el &quot;Gran Premio&quot;) es organizado por el titular de la plataforma ZonaMundial, con los siguientes datos identificativos:</p>
          <ul style={{ marginTop: 12 }}>
            <li><strong style={{ color: GOLD }}>Organizador:</strong> Carlos Manuel Zamudio Corral (empresario individual / autónomo)</li>
            <li><strong style={{ color: GOLD }}>Nombre comercial:</strong> SprintMarkt</li>
            <li><strong style={{ color: GOLD }}>NIF:</strong> 26581062P</li>
            <li><strong style={{ color: GOLD }}>Domicilio:</strong> Avenida General Avilés, 20 Duplo, 46015 Valencia, España</li>
            <li><strong style={{ color: GOLD }}>Plataforma:</strong> zonamundial.app</li>
            <li><strong style={{ color: GOLD }}>Email de contacto:</strong> <a href="mailto:gol@zonamundial.app" style={{ color: GOLD }}>gol@zonamundial.app</a></li>
          </ul>
        </Section>

        <Section title="2. Naturaleza del concurso">
          <p>El Gran Premio es un <strong style={{ color: GOLD }}>concurso de habilidad</strong> en el que el resultado depende exclusivamente de la destreza, el conocimiento futbolístico y la capacidad de análisis del participante, medidos a través de su <strong style={{ color: GOLD }}>tasa de acierto</strong> en las predicciones realizadas durante el torneo de selecciones nacionales 2026.</p>
          <ul style={{ marginTop: 12 }}>
            <li>El ganador NO se determina por sorteo ni por ningún mecanismo de azar.</li>
            <li>El resultado depende del mérito demostrable del participante (porcentaje de aciertos), no de la suerte.</li>
            <li>La participación es <strong style={{ color: GOLD }}>totalmente gratuita</strong>: no se exige compra, suscripción, ni desembolso económico alguno para participar ni para optar al premio.</li>
            <li>Al no mediar contraprestación económica del participante ni intervenir el azar, el Gran Premio queda <strong style={{ color: GOLD }}>fuera del ámbito de la regulación del juego</strong> y, por tanto, no requiere autorización de la Dirección General de Ordenación del Juego (Ley 13/2011, de regulación del juego).</li>
          </ul>
        </Section>

        <Section title="3. Premio y financiación">
          <p>El premio del Gran Premio es <strong style={{ color: GOLD }}>financiado íntegramente por el patrocinador</strong> del concurso. ZonaMundial actúa exclusivamente como organizador y plataforma de participación; el premio no procede en ningún caso de las aportaciones de otros usuarios.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Distribución del premio</h4>
          <p>El premio se reparte entre los tres primeros clasificados del ranking global por tasa de acierto, según el detalle publicado en la plataforma en el momento del concurso (por ejemplo, tarjetas regalo para el 1.º, 2.º y 3.º puesto). El detalle exacto y el valor del premio se mostrarán de forma visible junto al ranking y podrán variar en función del patrocinador.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Naturaleza del premio</h4>
          <ul>
            <li>El premio es personal e intransferible y no podrá ser canjeado por su valor en metálico, salvo que el patrocinador disponga expresamente lo contrario.</li>
            <li>Cualquier obligación fiscal derivada de la entrega del premio se regirá por la normativa tributaria vigente y será comunicada al ganador, en su caso.</li>
          </ul>
        </Section>

        <Section title="4. Participantes y requisitos">
          <ul>
            <li>Podrán participar las personas usuarias registradas en ZonaMundial mayores de 14 años. Los menores de 18 años deberán contar con el consentimiento de sus progenitores o tutores legales para recoger el premio.</li>
            <li>Para optar al premio será necesario haber realizado un <strong style={{ color: GOLD }}>mínimo de 20 predicciones válidas</strong> durante la ventana del concurso, a fin de garantizar una muestra representativa de la habilidad del participante.</li>
            <li>Queda excluido del concurso el personal vinculado a la organización y al patrocinador, así como las cuentas internas o de pruebas de la plataforma.</li>
            <li>Quedará descalificado cualquier participante que emplee bots, automatizaciones, cuentas múltiples o cualquier práctica fraudulenta destinada a alterar el ranking.</li>
          </ul>
        </Section>

        <Section title="5. Mecánica">
          <ul>
            <li>Durante la ventana del concurso, cada usuario realiza sus predicciones sobre los partidos del torneo dentro de la plataforma, de forma gratuita.</li>
            <li>El sistema calcula automáticamente la <strong style={{ color: GOLD }}>tasa de acierto</strong> de cada participante (porcentaje de predicciones correctas sobre el total de predicciones válidas).</li>
            <li>El ranking global se actualiza de forma continua y es visible para todos los usuarios, garantizando la transparencia del concurso.</li>
            <li>En caso de empate en la tasa de acierto, se utilizarán como criterios de desempate, por este orden: (1) mayor número de predicciones válidas realizadas; (2) acierto en predicciones de mayor dificultad; y (3) antigüedad del registro en la plataforma.</li>
          </ul>
        </Section>

        <Section title="6. Fechas">
          <ul>
            <li><strong style={{ color: GOLD }}>Ventana de participación:</strong> coincidente con la duración del torneo de selecciones nacionales 2026, desde el partido inaugural hasta la final, ambos incluidos.</li>
            <li>Solo computarán para el ranking las predicciones realizadas dentro de dicha ventana y antes del cierre de cada partido correspondiente.</li>
            <li>El ranking se cierra de forma definitiva una vez confirmado el resultado oficial de la final del torneo.</li>
          </ul>
        </Section>

        <Section title="7. Elección del ganador">
          <ul>
            <li>Una vez cerrado el ranking al finalizar el torneo, resultarán ganadores los participantes situados en las primeras posiciones del <strong style={{ color: GOLD }}>ranking global por tasa de acierto</strong>, según el número de premios disponibles.</li>
            <li>La selección de ganadores es objetiva y automática, basada exclusivamente en los datos de acierto registrados por el sistema.</li>
            <li>La organización verificará que cada ganador cumple los requisitos de participación antes de confirmar la entrega del premio.</li>
            <li>El fallo se comunicará a los ganadores y, en su caso, se publicará en la plataforma respetando la normativa de protección de datos.</li>
          </ul>
        </Section>

        <Section title="8. Entrega del premio">
          <ul>
            <li>La organización contactará con cada ganador a través del email asociado a su cuenta o de los canales de comunicación de la plataforma.</li>
            <li>El ganador deberá responder y aportar, en su caso, los datos necesarios para la entrega del premio en un plazo máximo de <strong style={{ color: GOLD }}>15 días naturales</strong> desde la comunicación.</li>
            <li>Si transcurrido dicho plazo el ganador no responde o no cumple los requisitos, la organización podrá declarar el premio desierto o asignarlo al siguiente clasificado.</li>
            <li>La entrega material del premio podrá gestionarse directamente por el patrocinador que lo financia, según lo acordado para cada edición del concurso.</li>
          </ul>
        </Section>

        <Section title="9. Protección de datos">
          <p>Los datos personales facilitados para la participación y, en su caso, para la entrega del premio, serán tratados por el organizador conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), con la finalidad exclusiva de gestionar el concurso, verificar a los ganadores y entregar los premios.</p>
          <p>Puedes consultar el detalle del tratamiento, la base jurídica, los plazos de conservación y el ejercicio de tus derechos en la <Link href="/legal/privacidad" style={{ color: GOLD }}>Política de Privacidad</Link>. Para cualquier solicitud relativa a tus datos puedes escribir a <a href="mailto:gol@zonamundial.app" style={{ color: GOLD }}>gol@zonamundial.app</a>.</p>
        </Section>

        <Section title="10. Aceptación de las bases y contacto">
          <p>La participación en el Gran Premio implica la aceptación íntegra de las presentes bases. La organización se reserva el derecho de modificar o cancelar el concurso por causas de fuerza mayor o ajenas a su voluntad, comunicándolo con la mayor antelación posible y sin que ello genere derecho a indemnización alguna.</p>
          <ul style={{ marginTop: 12 }}>
            <li>Email de contacto: <a href="mailto:gol@zonamundial.app" style={{ color: GOLD }}>gol@zonamundial.app</a></li>
            <li>Documentación legal: <Link href="/legal" style={{ color: GOLD }}>zonamundial.app/legal</Link></li>
          </ul>
          <p>Las presentes bases se rigen por la legislación española. Para la resolución de cualquier controversia, las partes se someten a los Juzgados y Tribunales de Valencia (España), sin perjuicio del fuero que corresponda a los usuarios con la condición de consumidores.</p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <h2 style={{ color: "#e8d48b", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
      <div style={{ lineHeight: 1.7, fontSize: 14 }}>{children}</div>
    </section>
  );
}
