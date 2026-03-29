/**
 * Shared contract for “living” content: one Firestore stream of engagement signals
 * that every tab can write to. useLivingApp and future generators read aggregates
 * to steer news, prompts, and difficulty — without manual curation.
 */
export const ENGAGEMENT_SIGNALS_COLLECTION = 'engagementSignals';
