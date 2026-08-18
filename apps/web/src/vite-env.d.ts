/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full URL to apps/api's base path, e.g. "https://agroflow-api.onrender.com/api/v1".
   * Unset in local dev -- vite.config.ts's proxy handles "/api/v1" instead. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
