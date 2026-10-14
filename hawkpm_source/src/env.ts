/**
 * Environment configuration for HawkPM.
 *
 * The deployed app is environment-agnostic for its own URL (MSAL resolves the
 * redirect URI from window.location.origin). This module exposes a simple
 * environment label so the UI can show which environment it is running in
 * (useful to avoid confusing UAT with Production).
 *
 * The value comes from the Vite build-time variable VITE_APP_ENV, injected per
 * environment by the build/CI (see package.json scripts and buildspec.yml).
 * Defaults to 'local' when unset (e.g. `npm run dev`).
 */

export type AppEnvironment = 'local' | 'uat' | 'production';

const raw = (import.meta.env.VITE_APP_ENV as string | undefined)?.toLowerCase();

export const APP_ENV: AppEnvironment =
  raw === 'uat' ? 'uat' : raw === 'production' || raw === 'prod' ? 'production' : 'local';

export const IS_PRODUCTION = APP_ENV === 'production';
export const IS_UAT = APP_ENV === 'uat';
export const IS_LOCAL = APP_ENV === 'local';

/** Human-readable label for display in the UI (empty for production). */
export const ENV_LABEL: string =
  APP_ENV === 'uat' ? 'UAT' : APP_ENV === 'local' ? 'LOCAL' : '';
