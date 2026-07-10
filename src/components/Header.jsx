import { Cpu, Search, Sun, Moon, Settings, User } from 'lucide-react';

export default function Header({ view, isDark, toggleTheme, query }) {
  return (
    <header className="h-16 w-full flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950">
      {/* Left Section (Brand Architecture) */}
      <div className="flex items-center gap-2">
        <Cpu className="w-5 h-5 text-zinc-900 dark:text-zinc-50" />
        <span className="font-extrabold text-lg tracking-tighter text-zinc-900 dark:text-zinc-50">
          MarketMind AI
        </span>
      </div>

      {/* Center Section (Contextual Display) */}
      <div className="flex-1 flex justify-center">
        {view !== 'SEARCH' && (
          <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-full bg-zinc-50 dark:bg-zinc-900/50">
            <Search className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
              QUERY: "{query || 'iPhone 16'}" [READ-ONLY]
            </span>
          </div>
        )}
      </div>

      {/* Right Section (Utility Matrix) */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          className="rounded-full p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          className="rounded-full p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
          aria-label="User Profile"
        >
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
