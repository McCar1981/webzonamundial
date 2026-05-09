// Pull-quote editorial — usado solo en el hero card.

import styles from "../selecciones.module.css";

interface PullQuoteProps {
  text: string;
  source: string;
}

export default function PullQuote({ text, source }: PullQuoteProps) {
  return (
    <blockquote className={styles.heroQuote}>
      <span className={styles.mark} aria-hidden="true">
        “
      </span>
      <p>{text}</p>
      <cite>— {source}</cite>
    </blockquote>
  );
}
