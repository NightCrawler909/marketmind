import AnalysisSession from '../models/AnalysisSession.js';
import RawReview from '../models/RawReview.js';
import IntelligenceReport from '../models/IntelligenceReport.js';
import { generateIntelligenceReport } from '../services/llmService.js';

export async function runSynthesizerAgent(req, res) {
  const { sessionId, query } = req.body;

  if (!sessionId || !query) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing sessionId or query.' }));
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const streamLog = (message) => {
    res.write(`data: ${JSON.stringify({ type: 'log', message })}\n\n`);
  };

  try {
    streamLog('Connecting to local Ollama inference engine...');

    const reviews = await RawReview.find({ sessionId }).lean();

    if (!reviews || reviews.length === 0) {
      streamLog('CRITICAL: No scraped reviews found for this session.');
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'No reviews found.' })}\n\n`);
      res.end();
      return;
    }

    streamLog(`Located ${reviews.length} raw reviews in database. Beginning synthesis...`);
    await AnalysisSession.findByIdAndUpdate(sessionId, { status: 'SYNTHESIZING' });

    const onProgress = (message) => {
      streamLog(`Synthesizer Agent: ${message}`);
    };

    const reportData = await generateIntelligenceReport(reviews, query, onProgress);

    streamLog('Saving intelligence report to database...');

    const report = new IntelligenceReport({
      sessionId,
      executiveSummary: reportData.executiveSummary,
      coreComplaints: reportData.coreComplaints,
      productBlueprint: reportData.productBlueprint,
    });

    await report.save();
    await AnalysisSession.findByIdAndUpdate(sessionId, { status: 'COMPLETED' });

    streamLog('Intelligence report saved. Pipeline complete.');

    res.write(`data: ${JSON.stringify({ type: 'complete', payload: { ...report.toObject(), reviews } })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Synthesizer Agent pipeline error:', error);
    streamLog(`CRITICAL FAILURE: ${error.message}`);
    await AnalysisSession.findByIdAndUpdate(sessionId, { status: 'FAILED' }).catch(() => {});
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
}
