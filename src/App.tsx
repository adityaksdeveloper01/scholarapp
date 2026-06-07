import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router';
import { useAppStore } from './store/appStore';
import { Layout } from './components/Layout';
import { DashboardHome } from './pages/DashboardHome';
import { StudyMaterials } from './pages/StudyMaterials';
import { VideoLibrary } from './pages/VideoLibrary';
import { Notifications } from './pages/Notifications';
import { Login } from './pages/Login';
import { UsersManage } from './pages/UsersManage';

import { Doubts } from './pages/Doubts';

function AppRoutes() {
  const { isAuthenticated, role } = useAppStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardHome />} />
        <Route path="materials" element={<StudyMaterials />} />
        <Route path="videos" element={<VideoLibrary />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="doubts" element={<Doubts />} />
        {role === 'teacher' && <Route path="users" element={<UsersManage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
