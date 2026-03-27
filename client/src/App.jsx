import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProjectsPage from './pages/ProjectsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-dark-bg dark:text-dark-text">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
