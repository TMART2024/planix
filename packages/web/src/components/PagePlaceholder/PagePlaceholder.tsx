import styles from './PagePlaceholder.module.css';

interface PagePlaceholderProps {
  title: string;
  subtitle?: string;
  body: string;
}

/*
 * Generic content-zone page used for Phase 0 routing. Feature pages replace
 * these in later phases. All copy comes in pre-translated via props.
 */
export function PagePlaceholder({ title, subtitle, body }: PagePlaceholderProps): JSX.Element {
  return (
    <section>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      <div className={styles.card}>{body}</div>
    </section>
  );
}
