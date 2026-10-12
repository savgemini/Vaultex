import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { classNames } from '@/lib/format';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={classNames(
        'p-2 rounded transition-colors hover:bg-surface-100 dark:hover:bg-surface-800',
        className,
      )}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-surface-400 dark:text-surface-300" />
      ) : (
        <Moon className="w-5 h-5 text-surface-600" />
      )}
    </button>
  );
}
