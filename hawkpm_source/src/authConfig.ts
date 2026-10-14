import type { Configuration, RedirectRequest } from '@azure/msal-browser';
import { LogLevel } from '@azure/msal-browser';

/**
 * Microsoft Entra ID (Azure AD) configuration for the HawkPM / EquitasPM app.
 *
 * App registration: "HawkPM" (SPA, no client secret - uses PKCE).
 * Redirect URIs that MUST be registered under the app's
 * "Single-page application" platform in Azure:
 *   - https://hawk.equitas.bank.in           (production)
 *   - https://hawkuat.equitasuat.bank.in     (UAT)
 *   - http://localhost:3000                  (local development)
 *
 * The redirect URI is resolved at runtime from the current origin, so the same
 * build works across all three environments as long as each URI is registered.
 */

const CLIENT_ID = 'a8bb89d9-c5d0-450c-b536-b8cbe0bd70cc';
const TENANT_ID = 'e22e4eaa-623f-4164-abb8-ac89a5a17e13';

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    // Uses the origin the app is served from (localhost:3000 in dev,
    // hawkuat.equitasuat.bank.in in UAT, hawk.equitas.bank.in in prod).
    // Each origin must be registered as an SPA redirect URI in Azure.
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    // Note: navigateToLoginRequestUrl moved to handleRedirectPromise() options in MSAL v5.
  },
  cache: {
    // localStorage persists the session across tabs/reloads.
    cacheLocation: 'localStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) {
          console.error('[MSAL]', message);
        }
      },
      logLevel: LogLevel.Error,
    },
  },
};

/**
 * Scopes requested at sign-in. User.Read lets us read the signed-in user's
 * basic profile (name, email) from Microsoft Graph.
 */
export const loginRequest: RedirectRequest = {
  scopes: ['User.Read'],
};
