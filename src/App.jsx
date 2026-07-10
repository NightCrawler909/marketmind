import { useState, useEffect } from 'react';
import Header from './components/Header';
import CommandCenter from './components/CommandCenter';
import PipelineTracker from './components/PipelineTracker';
import DashboardContainer from './components/DashboardContainer';
import { useAgentPipeline } from './hooks/useAgentPipeline';

function App() {
  const [view, setView] = useState('SEARCH');
  const [isDark, setIsDark] = useState(true);
  const [activeQuery, setActiveQuery] = useState('');
  
  const { currentAgent, pipelineStack, logs, reportData, startPipeline } = useAgentPipeline(setView);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-zinc-950 transition-colors duration-200 overflow-hidden">
      <Header isDark={isDark} toggleTheme={toggleTheme} view={view} query={activeQuery} />
      
      <main className="flex-1 flex flex-col text-zinc-900 dark:text-zinc-50 overflow-hidden">
        {view === 'SEARCH' && (
          <div className="flex-1 overflow-y-auto">
            <CommandCenter onLaunch={(q) => { setActiveQuery(q); startPipeline(q); }} />
          </div>
        )}
        {view === 'PROCESSING' && (
          <div className="flex-1 overflow-y-auto">
            <PipelineTracker 
              currentAgent={currentAgent} 
              logs={logs} 
              pipelineStack={pipelineStack} 
            />
          </div>
        )}
        {view === 'DASHBOARD' && (
          <DashboardContainer reportData={reportData} />
        )}
      </main>
    </div>
  );
}

export default App;
