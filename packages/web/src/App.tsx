import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ComingSoon } from './pages/ComingSoon';
import { Login } from './pages/Login';
import { PortalLogin } from './pages/PortalLogin';

export function App(): JSX.Element {
  return (
    <Routes>
      {/* Standalone auth routes — no shell. */}
      <Route path="/login" element={<Login />} />
      <Route path="/portal/login" element={<PortalLogin />} />

      {/* Authenticated app shell. */}
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/my-tasks" element={<ComingSoon titleKey="nav.myTasks" />} />
        <Route path="/team" element={<ComingSoon titleKey="nav.team" />} />
        <Route path="/calendar" element={<ComingSoon titleKey="nav.calendar" />} />
        <Route path="/reports" element={<ComingSoon titleKey="nav.reports" />} />
        <Route path="/settings" element={<ComingSoon titleKey="nav.settings" />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
