import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '../BrandMark/BrandMark';
import styles from './Sidebar.module.css';

interface NavItem {
  to: string;
  labelKey: string;
  icon: JSX.Element;
}

/* Minimal inline line icons (16x16, currentColor) — no icon dependency. */
const icon = (path: JSX.Element): JSX.Element => (
  <svg
    className={styles.icon}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {path}
  </svg>
);

const mainItems: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: icon(<><rect x="2" y="2" width="5" height="5" /><rect x="9" y="2" width="5" height="5" /><rect x="2" y="9" width="5" height="5" /><rect x="9" y="9" width="5" height="5" /></>) },
  { to: '/projects', labelKey: 'nav.projects', icon: icon(<><path d="M2 4h5l1.5 2H14v6H2z" /></>) },
  { to: '/my-tasks', labelKey: 'nav.myTasks', icon: icon(<><path d="M3 4l2 2 3-3" /><line x1="9" y1="4" x2="14" y2="4" /><line x1="2" y1="11" x2="14" y2="11" /></>) },
];

const workspaceItems: NavItem[] = [
  { to: '/team', labelKey: 'nav.team', icon: icon(<><circle cx="6" cy="6" r="2.2" /><path d="M2.5 13c0-2 1.6-3.2 3.5-3.2S9.5 11 9.5 13" /><circle cx="11.5" cy="6.5" r="1.6" /></>) },
  { to: '/calendar', labelKey: 'nav.calendar', icon: icon(<><rect x="2" y="3" width="12" height="11" rx="1" /><line x1="2" y1="6" x2="14" y2="6" /><line x1="5" y1="1.5" x2="5" y2="4" /><line x1="11" y1="1.5" x2="11" y2="4" /></>) },
  { to: '/reports', labelKey: 'nav.reports', icon: icon(<><line x1="3" y1="13" x2="3" y2="7" /><line x1="8" y1="13" x2="8" y2="3" /><line x1="13" y1="13" x2="13" y2="9" /></>) },
  { to: '/settings', labelKey: 'nav.settings', icon: icon(<><circle cx="8" cy="8" r="2" /><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" /></>) },
];

function NavSection({ titleKey, items }: { titleKey: string; items: NavItem[] }): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <div className={styles.sectionLabel}>{t(titleKey)}</div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive ? `${styles.item} ${styles.itemActive}` : styles.item
          }
        >
          {item.icon}
          <span>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </>
  );
}

export function Sidebar(): JSX.Element {
  const { t } = useTranslation();
  return (
    <aside className={styles.sidebar} aria-label={t('nav.sectionMain')}>
      <div className={styles.brand}>
        <BrandMark withTagline />
      </div>
      <nav className={styles.nav}>
        <NavSection titleKey="nav.sectionMain" items={mainItems} />
        <NavSection titleKey="nav.sectionWorkspace" items={workspaceItems} />
      </nav>
    </aside>
  );
}
