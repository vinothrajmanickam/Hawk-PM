import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import type { AccountInfo } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import App from './App.tsx';
import { msalConfig } from './authConfig';
import './index.css';

// Single MSAL instance for the whole app.
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL, then render. initialize() + handleRedirectPromise() must
// complete before React renders so the redirect response is processed.
msalInstance
  .initialize()
  .then(() => {
    // If there's already a signed-in account, set it as active.
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }

    // Keep the active account in sync after a successful login.
    // In MSAL v5 the LOGIN_SUCCESS payload is an AccountInfo object.
    msalInstance.addEventCallback((event) => {
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const account = event.payload as AccountInfo;
        msalInstance.setActiveAccount(account);
      }
    });

    // navigateToLoginRequestUrl moved from config to this options object in v5.
    return msalInstance.handleRedirectPromise({ navigateToLoginRequestUrl: true });
  })
  .catch((err) => {
    console.error('[MSAL] initialization error:', err);
  })
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </StrictMode>,
    );
  });
