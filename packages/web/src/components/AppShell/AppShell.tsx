import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { TopBar } from '../TopBar/TopBar';
import styles from './AppShell.module.css';

/*
 * The Planix shell: full-height sidebar on the left (unified chrome,
 * --px-bg-shell, separated only by a 1px right border), a top bar over the
 * content column, and the routed content zone (--px-bg-base) below it.
 */
export function AppShell(): JSX.Element {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
