import type { AssistantErrorCode } from './aiService';
import type { Lang } from '../hooks/useTranslation';

/** Strip anything that could be mistaken for a key from logs shown in UI */
export function sanitizeGoogleMessage(raw: string | undefined): string {
  if (!raw?.trim()) return '';
  return raw
    .replace(/\bAIza[\w-]{10,}\b/g, '[verborgen sleutel]')
    .replace(/key[=:]\s*[\w-]+/gi, 'key=[verborgen]')
    .slice(0, 400);
}

/**
 * Human hints for why Gemini failed in the browser. Most “key is right but never works”
 * cases are: (1) Generative Language API disabled, (2) API key HTTP referrer blocks Vercel.
 */
export function explainGeminiFailure(
  code: AssistantErrorCode,
  detail: string | undefined,
  lang: Lang
): string {
  const d = (detail || '').toLowerCase();
  const en = lang === 'EN' || lang === 'PT' || lang === 'TA';

  if (
    d.includes('referrer') ||
    d.includes('referer') ||
    d.includes('referer_blocked') ||
    d.includes('referrer_blocked') ||
    d.includes('http_referrer') ||
    d.includes('browser key')
  ) {
    return en
      ? 'Likely cause: API key “website restrictions” block this URL. In Google Cloud → APIs & Services → Credentials → your key → set Application restriction to HTTP referrers and add your site: https://YOUR-APP.vercel.app/* and https://*.vercel.app/* (or temporarily “None” to verify).'
      : 'Waarschijnlijke oorzaak: je API-sleutel staat op “website”-beperkingen die dit Vercel-domein niet toestaan. Google Cloud → APIs & Services → Credentials → jouw sleutel → Application restrictions: voeg toe: https://jouw-app.vercel.app/* en eventueel https://*.vercel.app/* — of zet tijdelijk op “None” om te testen.';
  }

  if (
    code === 'permission' ||
    d.includes('permission_denied') ||
    d.includes('consumer_suspended') ||
    (d.includes('generative') && d.includes('api')) ||
    d.includes('has not been used in project') ||
    d.includes('service disabled')
  ) {
    return en
      ? 'Enable “Generative Language API” in the same Google Cloud project as your API key. Critical: open console.cloud.google.com and use the project dropdown (top bar) — pick the project name shown next to your key in Google AI Studio (e.g. “Gemini Project Culture app”), not a different project like “My First Project”. Then APIs & Services → Library → Generative Language API → Enable. Key + enabled API must match one project.'
      : 'Zet “Generative Language API” aan in hetzelfde Google Cloud-project als je API-sleutel. Belangrijk: ga naar console.cloud.google.com en kies rechtsboven in de project-dropdown exact het project dat bij je sleutel in Google AI Studio staat (bijv. “Gemini Project Culture app”) — niet per ongeluk “My First Project” als je sleutel ergens anders hoort. Daarna: APIs & Services → Bibliotheek → Generative Language API → Inschakelen. Sleutel en ingeschakelde API moeten één project zijn.';
  }

  if (code === 'invalid_key' || d.includes('api key not valid') || d.includes('invalid api key')) {
    return en
      ? 'The key is rejected. Create a new key in Google AI Studio (or Cloud Console), copy it exactly into VITE_GEMINI_API_KEY on Vercel (Production + Preview if needed), then redeploy — Vite bakes the key in at build time.'
      : 'De sleutel wordt geweigerd. Maak een nieuwe sleutel in Google AI Studio, zet exact in Vercel als VITE_GEMINI_API_KEY (Production én Preview als je preview-test), daarna opnieuw deployen — de sleutel zit in de build.';
  }

  if (code === 'quota' || d.includes('resource exhausted') || d.includes('quota')) {
    return en
      ? 'Quota or rate limit hit. Wait a few minutes or check Google AI Studio / Cloud quotas for this project.'
      : 'Quota of rate limit bereikt. Wacht even of bekijk de quota in Google AI Studio / Cloud voor dit project.';
  }

  const safe = sanitizeGoogleMessage(detail);
  if (safe) {
    return en
      ? `Google said: ${safe}`
      : `Technische melding van Google: ${safe}`;
  }

  return en
    ? 'Unknown error. Open DevTools → Console for [Dupo-Atlas] logs when testing locally.'
    : 'Onbekende fout. Open DevTools → Console en zoek naar [Dupo-Atlas] bij lokaal testen.';
}
