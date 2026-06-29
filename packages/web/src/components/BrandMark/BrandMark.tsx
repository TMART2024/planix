import { useTranslation } from 'react-i18next';
import styles from './BrandMark.module.css';

interface BrandMarkProps {
  /** Show the "by CHR Solutions" tagline beneath the wordmark. */
  withTagline?: boolean;
  /** Larger sizing for login screens. */
  size?: 'default' | 'large';
}

/*
 * Planix internal product brand: a timeline/gantt-motif mark in the teal accent
 * plus the "Planix" wordmark. INTERNAL USE ONLY — never render this on
 * customer-facing surfaces (portal, reports, emails), per CLAUDE.md rule #4.
 */
export function BrandMark({ withTagline = false, size = 'default' }: BrandMarkProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className={`${styles.brand} ${size === 'large' ? styles.large : ''}`}>
      <svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true">
        <rect className={styles.tile} x="1" y="1" width="30" height="30" rx="8" />
        <rect className={styles.bar} x="8" y="9.5" width="15" height="3.2" rx="1.6" />
        <rect className={styles.bar} x="8" y="14.4" width="10" height="3.2" rx="1.6" opacity="0.82" />
        <rect className={styles.bar} x="8" y="19.3" width="6" height="3.2" rx="1.6" opacity="0.64" />
      </svg>
      <span className={styles.text}>
        <span className={styles.word}>{t('app.name')}</span>
        {withTagline ? <span className={styles.tagline}>{t('app.tagline')}</span> : null}
      </span>
    </div>
  );
}
