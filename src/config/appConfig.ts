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
  if (raw && typeof raw === 'string' && raw.trim().length > 0) {
    try {
      return JSON.parse(raw) as HubConfig;
    } catch {
      console.warn('[DUPOIND] VITE_HUB_CONFIG is invalid JSON; using hub.defaults.json');
    }
  }
  return hubDefaults as HubConfig;
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
