'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/* Light / dark switch, in the same style as the header's theme button. */
export default function ThemeToggle() {
  const { theme, themeMode, toggleTheme, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        mounted && themeMode === 'system'
          ? `Toggle theme (following system: ${theme})`
          : 'Toggle theme'
      }
      className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-primary transition-colors duration-200 hover:bg-card-hover"
    >
      {mounted && theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
