// Web app config -- API base URL, feature flags per role.
//
// Local dev: unset VITE_API_BASE_URL and vite.config.ts's dev-server
// proxy forwards "/api/v1" to apps/api on localhost -- no CORS issues.
// Production: apps/web (static site) and apps/api (separate service)
// live on different Render domains, so VITE_API_BASE_URL must be set
// at build time to the API's full URL, e.g.
// "https://agroflow-api.onrender.com/api/v1" -- see DEPLOYMENT.md.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
