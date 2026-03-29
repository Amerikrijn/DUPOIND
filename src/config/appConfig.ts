import hubDefaults from './hub.defaults.json';

export type HubCity = {
  id: string;
  displayName: string;
  flag: string;
  timezone: string;
  countryCode: string;
  countryName: string;
  lat: number;
  lng: number;
  wikipediaTitle: string;
  accentColor: string;
};

export type HubConfig = typeof hubDefaults & {
  cities: HubCity[];
};

let cached: HubConfig | null = null;

function parseHubConfig(): HubConfig {
  const raw = import.meta.env.VITE_HUB_CONFIG;
  const base = hubDefaults as HubConfig;
  
  if (raw && typeof raw === 'string' && raw.trim().length > 0) {
    try {
      const overrides = JSON.parse(raw);
      return {
        ...base,
        ...overrides,
        // Deep merge cities if they exist as an array
        cities: Array.isArray(overrides.cities) ? overrides.cities : base.cities,
        // Ensure other critical objects are merged
        newsFeeds: { ...base.newsFeeds, ...overrides.newsFeeds },
        ipCountryToDefaultCity: { ...base.ipCountryToDefaultCity, ...overrides.ipCountryToDefaultCity },
        ipCountryToLang: { ...base.ipCountryToLang, ...overrides.ipCountryToLang },
      } as HubConfig;
    } catch {
      console.warn('[DUPOIND] VITE_HUB_CONFIG is invalid JSON; using hub.defaults.json');
    }
  }
  return base;
}

export function getHubConfig(): HubConfig {
  if (!cached) cached = parseHubConfig();
  return cached;
}

export function getCityById(id: string): HubCity | undefined {
  return getHubConfig().cities.find((c) => c.id === id);
}

/** CSS variable reference: --hub-city-{id} must be set via applyHubTheme() */
export function hubAccentVar(cityId: string): string {
  return `var(--hub-city-${cityId}, var(--primary))`;
}

export function applyHubTheme(): void {
  const root = document.documentElement;
  const cfg = getHubConfig();
  for (const c of cfg.cities) {
    root.style.setProperty(`--hub-city-${c.id}`, c.accentColor);
  }
  document.title = cfg.appName;
}
