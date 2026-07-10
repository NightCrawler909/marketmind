import { Loader2, CheckCircle2 } from 'lucide-react';

export default function PipelineTracker({ currentAgent, pipelineStack, logs }) {
  const isScoutActive = currentAgent === 'Scout';
  const isSynthActive = currentAgent === 'Synthesizer';
  const isProductActive = currentAgent === 'Product';
  
  const scoutDone = currentAgent !== 'Scout' && currentAgent !== null;
  const synthDone = currentAgent === 'Product' || (currentAgent !== 'Synthesizer' && scoutDone);

  return (
    <div className="max-w-3xl mx-auto w-full py-12 px-6 flex flex-col gap-6">
      {/* Scout Panel */}
      <div className={`p-6 border rounded-lg transition-all ${isScoutActive || scoutDone ? 'border-zinc-950 dark:border-zinc-50 opacity-100' : 'border-zinc-200 dark:border-zinc-800 opacity-40'}`}>
        <div className="flex items-center gap-4 mb-4">
          {pipelineStack.length > 0 && isScoutActive ? (
            <Loader2 className="w-6 h-6 animate-spin text-zinc-900 dark:text-zinc-50" />
          ) : scoutDone ? (
            <CheckCircle2 className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-700" />
          )}
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">1. Scout Agent Phase</h2>
        </div>
        <div className="flex gap-4 font-mono text-xs">
           <span className={`${!pipelineStack.includes('Amazon') ? 'text-zinc-400 dark:text-zinc-600 line-through' : 'text-zinc-900 dark:text-zinc-50 font-bold'}`}>Amazon</span>
           <span className={`${!pipelineStack.includes('Flipkart') ? 'text-zinc-400 dark:text-zinc-600 line-through' : 'text-zinc-900 dark:text-zinc-50 font-bold'}`}>Flipkart</span>
           <span className={`${!pipelineStack.includes('Reddit') ? 'text-zinc-400 dark:text-zinc-600 line-through' : 'text-zinc-900 dark:text-zinc-50 font-bold'}`}>Reddit</span>
        </div>
      </div>

      {/* Synthesizer Panel */}
      <div className={`p-6 border rounded-lg transition-all ${isSynthActive || synthDone ? 'border-zinc-950 dark:border-zinc-50 opacity-100' : 'border-zinc-200 dark:border-zinc-800 opacity-40'}`}>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">2. Synthesizer Agent Phase</h2>
        </div>
        {(isSynthActive || synthDone || logs.length > 0) && (
          <div className="bg-zinc-950 text-zinc-50 dark:bg-zinc-900 border border-zinc-800 p-4 rounded font-mono text-xs overflow-y-auto h-40 flex flex-col gap-1">
            {logs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        )}
      </div>

      {/* Product Panel */}
      <div className={`p-6 border rounded-lg transition-all ${isProductActive ? 'border-zinc-950 dark:border-zinc-50 opacity-100 bg-zinc-50 dark:bg-zinc-900/50' : 'border-zinc-200 dark:border-zinc-800 opacity-40'}`}>
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">3. Product Agent Phase</h2>
        </div>
        {isProductActive && (
          <p className="mt-4 font-mono text-sm text-zinc-600 dark:text-zinc-400">
            Drafting technical blueprint alternative...
          </p>
        )}
      </div>
    </div>
  );
}
