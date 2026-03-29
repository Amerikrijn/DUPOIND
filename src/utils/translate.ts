/**
 * CULTURAL_PHRASES: A mapping of common squad-slang to ensure 
 * translations maintain context and "energy" rather than literal word-for-word.
 */
const CULTURAL_PHRASES: Record<string, Record<string, string>> = {
  "lekker bezig": {
    nl: "Lekker bezig!",
    pt: "Arrasou!",
    ta: "மிகவும் நன்று!",
    en: "Doing great!",
  },
  "bom trabalho": {
    nl: "Goed gewerkt!",
    pt: "Bom trabalho!",
    ta: "நல்ல வேலை!",
    en: "Great work!",
  },
  "vera level": {
    nl: "Top niveau!",
    pt: "Nível Vera!",
    ta: "சிறந்த நிலை!",
    en: "Next level!",
  }
};

export async function translateText(text: string, toLang: 'nl' | 'pt' | 'ta' | 'en', fromLang?: string) {
  const cleanText = text.trim().toLowerCase();
  
  // 1. Check Cultural Interceptor first
  for (const phrase in CULTURAL_PHRASES) {
    if (cleanText.includes(phrase)) {
      return CULTURAL_PHRASES[phrase][toLang] || text;
    }
  }

  try {
    if (fromLang && fromLang.toLowerCase() === toLang.toLowerCase()) return text;
    
    const pair = fromLang ? `${fromLang}|${toLang}` : `Autodetect|${toLang}`;
    // Adding 'de' (email) improves quality/limit on MyMemory
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}&de=contact@dupoind.hub`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    return text;
  } catch (error) {
    console.error('Translation failed:', error);
    return text;
  }
}

/**
 * Returns translation objects for NL, PT, TA and EN (for UI language switching).
 */
export async function getFullTranslation(text: string, fromLang?: string) {
  const [nl, pt, ta, en] = await Promise.all([
    translateText(text, 'nl', fromLang),
    translateText(text, 'pt', fromLang),
    translateText(text, 'ta', fromLang),
    translateText(text, 'en', fromLang),
  ]);

  return { nl, pt, ta, en };
}
