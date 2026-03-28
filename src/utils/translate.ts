/**
 * Real translation utility using the MyMemory API (free public API).
 * Integrates directly with DUPOIND's multilingual Culture Wall.
 */

export async function translateText(text: string, toLang: 'nl' | 'pt' | 'ta', fromLang?: string) {
  try {
    if (fromLang && fromLang.toLowerCase() === toLang.toLowerCase()) return text;
    
    // Use 'Autodetect' if fromLang is not provided, otherwise use explicit pair
    const pair = fromLang ? `${fromLang}|${toLang}` : `Autodetect|${toLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    return text; // Return original on error to be "honest" but safe
  } catch (error) {
    console.error('Translation failed:', error);
    return text;
  }
}

/**
 * Returns a full translation object for all three DUPOIND languages.
 */
export async function getFullTranslation(text: string, fromLang?: string) {
  const [nl, pt, ta] = await Promise.all([
    translateText(text, 'nl', fromLang),
    translateText(text, 'pt', fromLang),
    translateText(text, 'ta', fromLang)
  ]);

  return {
    nl: nl,
    pt: pt,
    ta: ta
  };
}
