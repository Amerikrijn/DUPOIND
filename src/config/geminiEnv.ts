/**
 * Vite bakes VITE_* vars into the bundle at build time.
 * On Vercel: set VITE_GEMINI_API_KEY under Project → Settings → Environment Variables
 * for Production (and Preview if needed), then redeploy so the client bundle is rebuilt.
 */
export function getGeminiApiKey(): string | undefined {
  const raw = import.meta.env.VITE_GEMINI_API_KEY;
  if (raw == null || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKey() !== undefined;
}
