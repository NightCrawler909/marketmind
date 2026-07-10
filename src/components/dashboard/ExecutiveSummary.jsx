import { TriangleAlert } from 'lucide-react';

export default function ExecutiveSummary({ reportData }) {
  const exec = reportData?.executiveSummary;
  const complaints = reportData?.coreComplaints || [];
  const vulnIndex = exec?.vulnerabilityIndex ?? 0;

  const sentiments = (exec?.platformBreakdown || []).map((p) => ({
    platform: p.platform || 'N/A',
    label: `${p.negativePercent ?? 0}% NEG`,
    pct: p.negativePercent ?? 0,
  }));

  const fallbackSentiments = sentiments.length > 0
    ? sentiments
    : [
        { platform: 'Amazon', label: 'N/A', pct: 0 },
        { platform: 'Flipkart', label: 'N/A', pct: 0 },
        { platform: 'Reddit', label: 'N/A', pct: 0 },
      ];

  const vulnLabel = vulnIndex >= 70 ? 'CRITICAL ACTION REQUIRED' : vulnIndex >= 40 ? 'MODERATE RISK' : 'LOW RISK';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
      {/* Card A: Sentiment Breakdown */}
      <div className="border border-zinc-200 dark:border-zinc-800 p-6 rounded-lg">
        <div className="mb-6">
          <h2 className="font-extrabold text-lg tracking-tight text-zinc-950 dark:text-zinc-50">PLATFORM SENTIMENT</h2>
          <p className="text-[10px] font-mono text-zinc-500 tracking-wider">AGGREGATION OF USER FEEDBACK</p>
        </div>
        <div className="flex flex-col gap-5">
          {fallbackSentiments.map(s => (
            <div key={s.platform}>
              <div className="flex justify-between items-center mb-2 font-mono text-xs">
                <span className="text-zinc-900 dark:text-zinc-100">{s.platform}</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{s.label}</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded overflow-hidden">
                <div 
                  className="h-full bg-zinc-950 dark:bg-zinc-50 transition-all duration-1000" 
                  style={{ width: `${s.pct}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card B: Core Complaints */}
      <div className="border border-zinc-200 dark:border-zinc-800 p-0 rounded-lg overflow-hidden flex flex-col">
        <div className="p-6 pb-4">
          <h2 className="font-extrabold text-lg tracking-tight text-zinc-950 dark:text-zinc-50">CORE COMPLAINTS</h2>
          <p className="text-[10px] font-mono text-zinc-500 tracking-wider">IDENTIFIED FRICTION POINTS</p>
        </div>
        <div className="flex-1 flex flex-col">
          {complaints.length > 0 ? complaints.map((c, i) => (
            <div key={i} className="flex-1 p-6 border-t border-zinc-100 dark:border-zinc-900 flex gap-4 items-start">
              <TriangleAlert className="w-5 h-5 mt-0.5 text-zinc-900 dark:text-zinc-50 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 leading-none">{c.title || 'N/A'}</h3>
                  {c.severity && (
                    <span className="text-[9px] font-mono tracking-wider border border-zinc-300 dark:border-zinc-700 px-1.5 py-0.5 rounded text-zinc-500">
                      {c.severity}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{c.summary || c.desc || 'No details available.'}</p>
              </div>
            </div>
          )) : (
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 text-center">
              <span className="font-mono text-xs text-zinc-400">No complaint data available.</span>
            </div>
          )}
        </div>
      </div>

      {/* Card C: Vulnerability Index */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col items-center justify-center p-8 relative overflow-hidden group">
        {/* Background Stripe Pattern (animated on hover) */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.08]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)`
          }}
        />
        
        {/* Tooltip Wrapper */}
        <div className="relative group/tooltip flex items-center justify-center z-10 mb-8">
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 border-b border-dashed border-zinc-500/50 cursor-help transition-colors hover:text-zinc-700 dark:hover:text-zinc-300">
            MARKET VULNERABILITY INDEX
          </span>
          
          {/* Tooltip Popup */}
          <div className="absolute bottom-full mb-3 w-48 p-2.5 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs leading-relaxed text-center rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none shadow-xl transform translate-y-2 group-hover/tooltip:translate-y-0">
            A weighted score from 1-100 reflecting the ratio and severity of negative sentiment across all scraped platforms.
            {/* Tooltip Caret */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100"></div>
          </div>
        </div>
        
        <div className="flex items-start relative z-10 transition-transform duration-500 group-hover:scale-105">
          <span className="text-7xl font-extrabold tracking-tighter text-zinc-950 dark:text-zinc-50 leading-none">
            {vulnIndex}
          </span>
          <span className="text-2xl font-light text-zinc-400 mt-6 leading-none">
            /100
          </span>
        </div>
        
        <div className="border border-zinc-900 dark:border-zinc-100 px-3 py-1 text-[10px] font-mono uppercase mt-8 text-zinc-950 dark:text-zinc-50 font-bold tracking-widest relative z-10 transition-colors duration-300 group-hover:bg-zinc-900 group-hover:text-zinc-50 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900">
          {vulnLabel}
        </div>
      </div>
    </div>
  );
}
