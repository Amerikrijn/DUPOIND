/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_GEMINI_API_KEY: string;
  /** Optional: full hub JSON; overrides src/config/hub.defaults.json */
  readonly VITE_HUB_CONFIG: string;
  /** Baked at build; compared to /version.json for update banner */
  readonly VITE_BUILD_ID: string;
  /**
   * Optional POST endpoint: JSON body { text, to, from? } → JSON { translatedText }.
   * If set, tried before MyMemory.
   */
  readonly VITE_TRANSLATE_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
