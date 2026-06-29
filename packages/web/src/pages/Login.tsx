import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '../components/BrandMark/BrandMark';
import styles from './Login.module.css';

/*
 * Internal-user login. Phase 0 renders the entry point; the MSAL Azure AD
 * redirect flow is wired to the button in a follow-up within Phase 0 once the
 * Azure app registration client id is provisioned.
 */
export function Login(): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <BrandMark size="large" withTagline />
        </div>
        <h1 className={styles.title}>{t('auth.login.title')}</h1>
        <p className={styles.subtitle}>{t('auth.login.subtitle')}</p>
        <button type="button" className={styles.primaryButton}>
          {t('auth.login.ssoButton')}
        </button>
        <Link className={styles.secondaryLink} to="/portal/login">
          {t('auth.login.portalLink')}
        </Link>
      </div>
    </div>
  );
}
