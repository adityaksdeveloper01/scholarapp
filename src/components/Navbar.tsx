import { Menu, Moon, Sun } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useAppStore();

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border bg-card">
      <div className="flex items-center gap-4 lg:hidden">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center justify-end flex-1 gap-2 sm:gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
