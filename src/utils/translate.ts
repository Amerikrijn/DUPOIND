/**
 * Real translation utility using the MyMemory API (free public API).
 * Integrates directly with DUPOIND's multilingual Culture Wall.
 */

export async function translateText(text: string, toLang: 'nl' | 'pt' | 'ta') {
  try {
    const pair = `en|${toLang === 'ta' ? 'ta' : toLang}`; // Simplified for MyMemory
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    return `[Translation Error: ${toLang.toUpperCase()}]`;
  } catch (error) {
    console.error('Translation failed:', error);
    return `[Offline: ${toLang.toUpperCase()}]`;
  }
}

/**
 * Returns a full translation object for all three DUPOIND languages.
 */
export async function getFullTranslation(text: string) {
  const [nl, pt, ta] = await Promise.all([
    translateText(text, 'nl'),
    translateText(text, 'pt'),
    translateText(text, 'ta')
  ]);

  return {
    nl: `🇳🇱 ${nl}`,
    pt: `🇵🇹 ${pt}`,
    ta: `🇮🇳 ${ta}`
  };
}
