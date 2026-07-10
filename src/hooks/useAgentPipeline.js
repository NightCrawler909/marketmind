import { useState, useCallback } from 'react';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export function useAgentPipeline(setView) {
  const [pipelineStack, setPipelineStack] = useState([]);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [logs, setLogs] = useState([]);
  const [reportData, setReportData] = useState(null);

  const startPipeline = useCallback(async (searchQuery) => {
    const sessionId = crypto.randomUUID();

    setView('PROCESSING');
    setPipelineStack(['Reddit', 'Flipkart', 'Amazon']);
    setCurrentAgent('Scout');
    setLogs([]);
    setReportData(null);

    try {
      // Scout Agent Phase
      setLogs(prev => [...prev, '> Scout Agent: Initializing parallel ingestion...']);

      const scoutRes = await fetch('/api/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, sessionId }),
      });

      if (!scoutRes.ok) {
        throw new Error(`Scout Agent failed with status ${scoutRes.status}`);
      }

      const scoutData = await scoutRes.json();

      setPipelineStack([]);
      setLogs(prev => [
        ...prev,
        `> Scout Agent: Parallel ingestion complete. ${scoutData.totalReviews} reviews collected.`,
        `> Scout Agent: Amazon(${scoutData.breakdown?.AMAZON || 0}) | Flipkart(${scoutData.breakdown?.FLIPKART || 0}) | Reddit(${scoutData.breakdown?.REDDIT || 0})`,
      ]);

      // Synthesizer Agent Phase (SSE Stream)
      setCurrentAgent('Synthesizer');
      setLogs(prev => [...prev, '> Synthesizer Agent: Opening SSE stream to inference engine...']);

      const synthRes = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, sessionId }),
      });

      if (!synthRes.ok) {
        throw new Error(`Synthesizer Agent failed with status ${synthRes.status}`);
      }

      const reader = synthRes.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let finalReport = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const payload = JSON.parse(trimmed.slice(6));

            if (payload.type === 'log') {
              setLogs(prev => [...prev, `> ${payload.message}`]);
            } else if (payload.type === 'complete') {
              finalReport = payload.payload;
            } else if (payload.type === 'error') {
              throw new Error(payload.message);
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes('JSON')) {
              throw parseErr;
            }
          }
        }
      }

      if (!finalReport) {
        throw new Error('SSE stream ended without delivering the intelligence report.');
      }

      setReportData(finalReport);

      // Product Agent Phase (UX transition)
      setCurrentAgent('Product');
      setLogs(prev => [...prev, '> Product Agent: Drafting technical blueprint...']);
      await delay(1000);

      // Completion
      setView('DASHBOARD');

    } catch (error) {
      setLogs(prev => [
        ...prev,
        `> CRITICAL FAILURE: ${error.message}`,
        '> Pipeline halted. Check backend connectivity and retry.',
      ]);
      setCurrentAgent(null);
    }
  }, [setView]);

  return { currentAgent, pipelineStack, logs, reportData, startPipeline };
}
