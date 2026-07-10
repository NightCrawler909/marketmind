import { useState } from 'react';
import { Search, Rocket } from 'lucide-react';

export default function CommandCenter({ onLaunch }) {
  const [query, setQuery] = useState('iPhone 16');

  return (
    <div className="flex-col justify-center max-w-2xl mx-auto w-full h-full pb-24 flex">
      {/* Hero Unit */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold tracking-tighter text-zinc-950 dark:text-zinc-50 mb-2">
          MarketMind AI
        </h1>
        <p className="text-xs tracking-widest text-zinc-400 font-mono uppercase">
          Multi-Agent E-Commerce & Sentiment Synthesis Engine
        </p>
      </div>

      {/* Search Box Architecture */}
      <div className="flex items-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2 mt-8">
        <div className="pl-3 pr-2">
          <Search className="w-5 h-5 text-zinc-400" />
        </div>
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent px-3 py-2 text-zinc-900 dark:text-zinc-50 focus:outline-none placeholder-zinc-400 font-mono text-sm"
          placeholder="Enter product query..."
        />
        <button 
          onClick={() => onLaunch(query)}
          className="bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 font-bold tracking-wider text-xs px-4 py-2 rounded hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          LAUNCH AGENTS
          <Rocket className="w-4 h-4" />
        </button>
      </div>

      {/* Configuration Accordion */}
      <div className="mt-6 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-950/50">
        <div className="text-xs font-mono text-zinc-500 mb-4 font-bold tracking-wider">
          AGENT PARAMETERS // ADVANCED
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
             <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 font-mono">
               <input type="checkbox" defaultChecked className="accent-zinc-900 dark:accent-zinc-50" /> Amazon
             </label>
             <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 font-mono">
               <input type="checkbox" defaultChecked className="accent-zinc-900 dark:accent-zinc-50" /> Flipkart
             </label>
             <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 font-mono">
               <input type="checkbox" defaultChecked className="accent-zinc-900 dark:accent-zinc-50" /> Reddit
             </label>
          </div>
          <div className="flex flex-col justify-center gap-2">
            <span className="text-xs font-mono text-zinc-500 tracking-wider">DATA DEPTH CONTROLLER</span>
            <input type="range" className="w-full accent-zinc-900 dark:accent-zinc-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
