import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiChevronDown, FiChevronRight, FiSettings } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';

function Sidebar() {
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [projects, setProjects] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();

        if (!cancelled) {
          setProjects(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setProjects([]);
        }
      }
    }

    loadProjects();
    const intervalId = window.setInterval(loadProjects, 30000);
    window.addEventListener('projects-updated', loadProjects);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('projects-updated', loadProjects);
    };
  }, []);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white/80 px-4 py-5 backdrop-blur dark:border-dark-border dark:bg-dark-sidebar">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-dark-text">
            Jireh&apos;s Dashboard
          </p>
          <p className="text-xs text-slate-500 dark:text-dark-muted">Project monitoring center</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-1 overflow-auto">
        <button
          type="button"
          onClick={() => setIsProjectsOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-dark-text dark:hover:bg-slate-800/70"
        >
          <span>Projects</span>
          {isProjectsOpen ? <FiChevronDown /> : <FiChevronRight />}
        </button>

        {isProjectsOpen ? (
          <div className="mt-2 space-y-1">
            {projects.map((project) => {
              const isActive = location.pathname === '/projects';

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate('/projects')}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-dark-muted dark:hover:bg-slate-800/60'
                  }`}
                >
                  {project.name}
                </button>
              );
            })}

            {!projects.length ? (
              <div className="rounded-lg px-3 py-2 text-sm text-slate-400 dark:text-slate-500">
                No projects yet
              </div>
            ) : null}
          </div>
        ) : null}

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `mt-5 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100 dark:text-dark-text dark:hover:bg-slate-800/70'
            }`
          }
        >
          <FiSettings />
          <span>Settings</span>
        </NavLink>
      </div>

      <div className="pt-4 text-xs text-slate-400 dark:text-slate-500">v1.0.0</div>
    </aside>
  );
}

export default Sidebar;
