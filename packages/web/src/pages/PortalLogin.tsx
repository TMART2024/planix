import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Login.module.css';

/*
 * Customer-portal login. Email/password against /api/v1/auth/portal/login.
 * Phase 0 renders the form and captures state; submission wiring lands with the
 * portal session flow. No Planix branding is shown to customers (CLAUDE.md #4).
 */
export function PortalLogin(): JSX.Element {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className={styles.wrap}>
      <form
        className={styles.card}
        onSubmit={(e) => {
          e.preventDefault();
          // Submission wired in the portal session flow.
        }}
      >
        <p className={styles.brand}>{t('app.name')}</p>
        <h1 className={styles.title}>{t('auth.portal.title')}</h1>
        <p className={styles.subtitle}>{t('auth.portal.subtitle')}</p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="portal-email">
            {t('auth.portal.emailLabel')}
          </label>
          <input
            id="portal-email"
            className={styles.input}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="portal-password">
            {t('auth.portal.passwordLabel')}
          </label>
          <input
            id="portal-password"
            className={styles.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className={styles.primaryButton}>
          {t('auth.portal.submit')}
        </button>
        <Link className={styles.secondaryLink} to="/login">
          {t('auth.portal.internalLink')}
        </Link>
      </form>
    </div>
  );
}
