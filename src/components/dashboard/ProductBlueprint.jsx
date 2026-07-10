import { Shield, Cpu } from 'lucide-react';

const FALLBACK_BLUEPRINT = {
  targetWeaknesses: [
    'Thermal management system insufficient for sustained workloads',
    'Display panel limited to 60Hz refresh rate on base model',
    'Battery chemistry degrades rapidly within first usage quarter',
  ],
  engineeringSolutions: [
    'Implement vapor chamber cooling with graphene thermal interface material',
    'Adopt LTPO OLED panel with adaptive 1-120Hz refresh rate',
    'Switch to silicon-carbon anode battery cells with improved cycle life',
  ],
  bomImpact: 'Implementing the recommended engineering solutions would increase the Bill of Materials cost by approximately 12-18%. The vapor chamber cooling adds $3.50 per unit, LTPO display upgrade adds $8-12 per unit depending on supplier, and silicon-carbon battery cells add $2-4 per unit. Total estimated BOM increase: $13.50-$19.50 per unit. At scale production (>1M units), supplier negotiations could reduce this premium to 8-14% through volume commitments and dual-sourcing strategies.',
};

export default function ProductBlueprint({ reportData }) {
  const blueprint = reportData?.productBlueprint || FALLBACK_BLUEPRINT;
  const weaknesses = blueprint.targetWeaknesses || [];
  const solutions = blueprint.engineeringSolutions || [];
  const bomImpact = blueprint.bomImpact || 'No BOM analysis available.';

  const pairCount = Math.max(weaknesses.length, solutions.length);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="font-extrabold text-lg tracking-tight text-zinc-950 dark:text-zinc-50">AI PRODUCT BLUEPRINT</h2>
        <p className="text-[10px] font-mono text-zinc-500 tracking-wider">STRATEGIC ENGINEERING RECOMMENDATIONS</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Vulnerability Mitigations */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold">VULNERABILITY MITIGATIONS</span>
          </div>

          {Array.from({ length: pairCount }).map((_, i) => (
            <div
              key={i}
              className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors"
            >
              <div className="mb-4">
                <span className="text-[9px] font-mono tracking-widest text-zinc-400 font-bold">
                  {String(i + 1).padStart(2, '0')} // TARGET WEAKNESS
                </span>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-1 leading-snug">
                  {weaknesses[i] || 'N/A'}
                </p>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <span className="text-[9px] font-mono tracking-widest text-zinc-400 font-bold">
                  {String(i + 1).padStart(2, '0')} // ENGINEERING FIX
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  {solutions[i] || 'No solution mapped.'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Column 2: Supply Chain & Cost Vector */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold">SUPPLY CHAIN & COST VECTOR</span>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">BOM & SUPPLY CHAIN IMPACT ANALYSIS</h3>
              <p className="text-[10px] font-mono text-zinc-500 tracking-wider mt-1">COST PROJECTION MODEL</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6">
              <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {bomImpact}
              </p>
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold">SOLUTION COVERAGE MATRIX</span>
            <div className="mt-4 space-y-3">
              {weaknesses.map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${solutions[i] ? 'bg-zinc-900 dark:bg-zinc-50' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate flex-1">{w}</span>
                  <span className="text-[9px] font-mono tracking-wider text-zinc-400">
                    {solutions[i] ? 'MAPPED' : 'UNMAPPED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
