const FALLBACK_REVIEWS = [
  { platform: 'AMAZON', rawText: 'Battery drains extremely fast after the latest update. Barely lasts half a day with normal usage.', metadata: { verifiedPurchase: true, rating: 2 } },
  { platform: 'REDDIT', rawText: 'The phone overheats significantly during gaming sessions. Thermal throttling is very noticeable on the base model.', metadata: { upvotes: 342 } },
  { platform: 'FLIPKART', rawText: 'The 60Hz display feels outdated in 2024. Scrolling is noticeably less smooth than 120Hz phones at this price.', metadata: { verified: true } },
  { platform: 'AMAZON', rawText: 'Camera quality in low light is disappointing compared to competitors. Night mode processing takes too long.', metadata: { verifiedPurchase: true, rating: 1 } },
  { platform: 'REDDIT', rawText: 'Signal reception in rural areas is significantly worse than competing Android phones. Constant drops on calls.', metadata: { upvotes: 189 } },
  { platform: 'FLIPKART', rawText: 'Glass back shatters easily on drop. Repair costs are exorbitant without insurance coverage.', metadata: { verified: true } },
];

export default function EvidenceExplorer({ reportData }) {
  const reviews = reportData?.reviews?.length > 0 ? reportData.reviews : FALLBACK_REVIEWS;

  const platformStyle = (platform) => {
    return 'bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 px-2 py-0.5 text-[9px] font-mono tracking-widest font-bold';
  };

  const renderMeta = (review) => {
    const meta = review.metadata || {};
    const tags = [];

    if (meta.upvotes !== undefined) tags.push(`↑ ${meta.upvotes}`);
    if (meta.verifiedPurchase) tags.push('VERIFIED');
    if (meta.verified) tags.push('VERIFIED');
    if (meta.rating !== undefined) tags.push(`★ ${meta.rating}/5`);

    return tags;
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="font-extrabold text-lg tracking-tight text-zinc-950 dark:text-zinc-50">RAW EVIDENCE JOURNAL</h2>
        <p className="text-[10px] font-mono text-zinc-500 tracking-wider">AGGREGATED MULTI-CHANNEL DATA STREAM</p>
      </div>

      <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
        {reviews.map((review, i) => (
          <div
            key={i}
            className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className={platformStyle(review.platform)}>
                [{review.platform}]
              </span>
              {renderMeta(review).map((tag, j) => (
                <span
                  key={j}
                  className="text-[9px] font-mono tracking-wider text-zinc-500 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
              <span className="ml-auto text-[9px] font-mono text-zinc-400">
                #{String(i + 1).padStart(3, '0')}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
              {review.rawText}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <span className="text-[10px] font-mono text-zinc-400 tracking-wider">
          TOTAL ENTRIES: {reviews.length} // SOURCE: SCOUT_AGENT_PIPELINE
        </span>
      </div>
    </div>
  );
}
