import { useTranslation } from 'react-i18next';
import { useTheme } from '../../stores/ThemeContext';
import styles from './ThemeToggle.module.css';

/*
 * DESIGN_SYSTEM.md: sun icon when in dark mode (click to switch to light),
 * moon icon when in light mode. Lives in the top bar, left of the bell.
 */
export function ThemeToggle(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const isDark = theme === 'dark';
  const label = isDark ? t('topbar.toggleToLight') : t('topbar.toggleToDark');

  return (
    <button type="button" className={styles.toggle} onClick={toggleTheme} aria-label={label} title={label}>
      {isDark ? (
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
        </svg>
      ) : (
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
