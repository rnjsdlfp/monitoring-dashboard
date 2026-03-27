import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const Icon = isDark ? FiSun : FiMoon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-dark-border dark:bg-dark-card dark:text-dark-text"
      aria-label="Toggle theme"
    >
      <Icon className="text-lg" />
    </button>
  );
}

export default ThemeToggle;
