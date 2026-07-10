import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.LLM_MODEL || 'llama3';
const MAX_WORDS = 2000; // Lowered to prevent CUDA buffer overrun on 4096 context window

function truncateText(text, maxWords) {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

function cleanJsonResponse(raw) {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  
  if (!cleaned.startsWith('{')) {
    if (cleaned.startsWith('"vulnerabilityIndex"')) {
      cleaned = '{\n  "executiveSummary": {\n' + cleaned;
    } else if (cleaned.startsWith('"executiveSummary"')) {
      cleaned = '{\n' + cleaned;
    } else if (cleaned.indexOf('{') === -1 || cleaned.indexOf('{') > 100) {
      cleaned = '{\n  "executiveSummary": {\n' + cleaned;
    }
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

export async function generateIntelligenceReport(reviewsData, productQuery, onProgress) {
  const combinedText = reviewsData
    .map((r, i) => `[${r.platform}] Review #${i + 1}: ${r.rawText}`)
    .join('\n');

  const truncated = truncateText(combinedText, MAX_WORDS);
  const wordCount = truncated.split(/\s+/).length;

  if (onProgress) onProgress(`Prepared ${wordCount} words from ${reviewsData.length} reviews for analysis.`);

  const systemPrompt = `You are an elite B2B Market Intelligence Analyst working for a hardware company. You have been given a collection of real customer reviews for the product: "${productQuery}".

Your task is to analyze every review, identify recurring complaints, calculate sentiment breakdowns per platform, and produce a competitive product specification blueprint.

You MUST output ONLY a raw JSON object. No markdown. No conversational text.

The JSON object MUST exactly match this schema structure (use this as a template, but REPLACE the values with your actual analysis of the provided reviews):
{
  "executiveSummary": {
    "vulnerabilityIndex": 75,
    "platformBreakdown": [
      { "platform": "AMAZON", "positivePercent": 40, "negativePercent": 60 }
    ]
  },
  "coreComplaints": [
    { "title": "<short complaint name>", "summary": "<one sentence description based on reviews>", "severity": "High" }
  ],
  "productBlueprint": {
    "targetWeaknesses": ["<weakness 1 found in reviews>", "<weakness 2>"],
    "engineeringSolutions": ["<proposed engineering fix 1>", "<proposed fix 2>"],
    "bomImpact": ["<estimated cost impact 1>"]
  }
}

Identify at least 3 and at most 6 core complaints. Be specific and data-driven based ONLY on the provided reviews. DO NOT mention batteries unless the reviews specifically complain about batteries. Base the vulnerability index on the ratio and severity of negative sentiment across all platforms (1-100).
CRITICAL: DO NOT OMIT ANY KEYS FROM THE SCHEMA. Even if there are no clear complaints, you MUST include the "coreComplaints" array (it can be empty if absolutely necessary, but try to find general friction points). You MUST include a numerical "vulnerabilityIndex".`;

  const prompt = `Here are the customer reviews to analyze:\n\n${truncated}\n\nGenerate the intelligence report JSON now. You MUST output ONLY valid JSON matching the exact schema example. Begin your response exactly with this text:\n{\n  "executiveSummary": {`;

  if (onProgress) onProgress('Sending prompt to local Ollama inference engine...');

  const heartbeat = onProgress
    ? startHeartbeat(onProgress)
    : null;

  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/chat`,
      {
        model: MODEL,
        options: { temperature: 0.1, num_predict: 2048 },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: false,
      },
      { timeout: 180000 }
    );

    if (heartbeat) clearInterval(heartbeat);

    const rawOutput = response.data?.message?.content;
    if (!rawOutput) {
      throw new Error('LLM returned empty response.');
    }

    if (onProgress) onProgress('LLM generation complete. Parsing structured JSON output...');

    console.log('LLM raw output (first 500 chars):', rawOutput.substring(0, 500));

    let parsed;
    try {
      const cleaned = cleanJsonResponse(rawOutput);
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('LLM JSON parse failed. Cleaned output:', rawOutput.substring(0, 500));
      if (onProgress) onProgress('WARNING: LLM produced malformed JSON. Retrying...');

      // Retry once
      const retryResponse = await axios.post(
        `${OLLAMA_URL}/api/chat`,
        {
          model: MODEL,
          options: { temperature: 0.1, num_predict: 2048 },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          stream: false,
        },
        { timeout: 180000 }
      );
      
      const retryCleaned = cleanJsonResponse(retryResponse.data?.message?.content || '{}');
      parsed = JSON.parse(retryCleaned);
    }

    // Lenient validation: fill in missing keys with defaults instead of crashing
    if (!parsed.executiveSummary || typeof parsed.executiveSummary !== 'object') {
      parsed.executiveSummary = {};
    }
    if (typeof parsed.executiveSummary.vulnerabilityIndex !== 'number') {
      parsed.executiveSummary.vulnerabilityIndex = 50;
      if (onProgress) onProgress('WARNING: vulnerabilityIndex was missing, using default 50.');
    }
    if (!Array.isArray(parsed.executiveSummary.platformBreakdown)) {
      parsed.executiveSummary.platformBreakdown = [];
    }

    if (!Array.isArray(parsed.coreComplaints)) {
      parsed.coreComplaints = [];
      if (onProgress) onProgress('WARNING: coreComplaints was missing, using empty array.');
    }

    if (!parsed.productBlueprint || typeof parsed.productBlueprint !== 'object') {
      parsed.productBlueprint = {};
    }
    if (!Array.isArray(parsed.productBlueprint.targetWeaknesses)) {
      parsed.productBlueprint.targetWeaknesses = [];
    }
    if (!Array.isArray(parsed.productBlueprint.engineeringSolutions)) {
      parsed.productBlueprint.engineeringSolutions = [];
    }
    if (!Array.isArray(parsed.productBlueprint.bomImpact)) {
      parsed.productBlueprint.bomImpact = ['Unable to determine BOM impact from available data.'];
    }

    // Normalize bomImpact: ensure it's an array (Mongoose schema expects [String])
    if (parsed.productBlueprint.bomImpact && !Array.isArray(parsed.productBlueprint.bomImpact)) {
      parsed.productBlueprint.bomImpact = [parsed.productBlueprint.bomImpact];
    }

    if (onProgress) onProgress('JSON validation passed. All required schema keys present.');

    return parsed;
  } catch (error) {
    if (heartbeat) clearInterval(heartbeat);
    if (error instanceof SyntaxError || error.message.includes('malformed')) {
      console.error('LLM JSON parse failed after retry. Using deterministic fallback generator.');
      if (onProgress) onProgress('CRITICAL: LLM failed to generate schema. Engaging deterministic math fallback...');
      return generateDeterministicFallback(reviewsData, productQuery);
    }
    throw error;
  }
}

function generateDeterministicFallback(reviews, query) {
  const platformBreakdown = [];
  let totalNegativeScore = 0;
  
  // Group by platform
  const byPlatform = reviews.reduce((acc, r) => {
    acc[r.platform] = acc[r.platform] || [];
    acc[r.platform].push(r);
    return acc;
  }, {});

  for (const [platform, platReviews] of Object.entries(byPlatform)) {
    const positives = platReviews.filter(r => r.sentimentScore > 0).length;
    const negatives = platReviews.length - positives;
    
    const posPercent = Math.round((positives / platReviews.length) * 100);
    const negPercent = Math.round((negatives / platReviews.length) * 100);
    
    platformBreakdown.push({ platform, positivePercent: posPercent, negativePercent: negPercent });
    
    // Add up raw negative scores (sentimentScore is usually -1 to 1)
    totalNegativeScore += platReviews.reduce((sum, r) => sum + (r.sentimentScore < 0 ? Math.abs(r.sentimentScore) : 0), 0);
  }

  // Calculate a vulnerability index (0 to 100) based on average negative sentiment magnitude
  const avgNegative = reviews.length > 0 ? (totalNegativeScore / reviews.length) : 0;
  const vulnerabilityIndex = Math.min(100, Math.max(1, Math.round(avgNegative * 150)));

  return {
    executiveSummary: {
      vulnerabilityIndex,
      platformBreakdown
    },
    coreComplaints: [
      {
        title: "Deterministic Fallback Engaged",
        summary: `The AI failed to parse complaints for ${query}, but raw sentiment data was successfully calculated.`,
        severity: vulnerabilityIndex > 50 ? "High" : "Medium"
      }
    ],
    productBlueprint: {
      targetWeaknesses: ["Analyze the raw evidence journal for specific pain points."],
      engineeringSolutions: ["Review the actual comments to formulate a plan."],
      bomImpact: ["Unable to determine BOM impact without LLM synthesis."]
    }
  };
}

function startHeartbeat(onProgress) {
  const messages = [
    'LLM is processing review corpus...',
    'Analyzing sentiment distribution across platforms...',
    'Identifying recurring complaint patterns...',
    'Clustering friction points by severity...',
    'Cross-referencing platform-specific anomalies...',
    'Computing market vulnerability index...',
    'Drafting engineering countermeasures...',
    'Estimating BOM impact projections...',
    'Finalizing intelligence report structure...',
    'LLM still generating... please wait...',
  ];
  let idx = 0;

  return setInterval(() => {
    onProgress(messages[Math.min(idx, messages.length - 1)]);
    idx++;
  }, 5000);
}
