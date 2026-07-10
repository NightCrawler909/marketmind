import { useState } from 'react';
import ExecutiveSummary from './dashboard/ExecutiveSummary';
import EvidenceExplorer from './dashboard/EvidenceExplorer';
import ProductBlueprint from './dashboard/ProductBlueprint';

export default function DashboardContainer({ reportData }) {
  const [activeTab, setActiveTab] = useState('EXECUTIVE_SUMMARY');
  
  const tabs = [
    { id: 'EXECUTIVE_SUMMARY', label: 'EXECUTIVE SUMMARY' },
    { id: 'EVIDENCE_EXPLORER', label: 'EVIDENCE EXPLORER' },
    { id: 'PRODUCT_BLUEPRINT', label: 'AI PRODUCT BLUEPRINT' }
  ];

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
      {/* Sub-Navigation Tab Bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-[10px] md:text-xs font-mono tracking-widest px-4 py-3 whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                  : 'bg-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* View Router */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {activeTab === 'EXECUTIVE_SUMMARY' && <ExecutiveSummary reportData={reportData} />}
        {activeTab === 'EVIDENCE_EXPLORER' && <EvidenceExplorer reportData={reportData} />}
        {activeTab === 'PRODUCT_BLUEPRINT' && <ProductBlueprint reportData={reportData} />}
      </div>
    </div>
  );
}
