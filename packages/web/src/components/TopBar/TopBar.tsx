import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import styles from './TopBar.module.css';

export function TopBar(): JSX.Element {
  const { t } = useTranslation();
  return (
    <header className={styles.topbar}>
      <input
        className={styles.search}
        type="search"
        placeholder={t('topbar.search')}
        aria-label={t('topbar.search')}
      />
      <div className={styles.spacer} />
      <div className={styles.actions}>
        <ThemeToggle />
        <button type="button" className={styles.iconButton} aria-label={t('topbar.notifications')} title={t('topbar.notifications')}>
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
            <path d="M10 21a2 2 0 0 0 4 0" />
          </svg>
        </button>
        <button type="button" className={styles.iconButton} aria-label={t('topbar.account')} title={t('topbar.account')}>
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}
