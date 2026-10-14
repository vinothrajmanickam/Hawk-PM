# UAT Deployment Runbook — HawkPM (EquitasPM)

Target UAT URL: **https://hawkuat.equitasuat.bank.in**
App type: Static single-page app (Vite + React). Build output is plain static files served over HTTPS.

---

## 1. Prerequisites (one-time)

- Node.js + npm on the build machine (same version used in dev).
- Network access to the npm registry for `npm install` (via the Zscaler allowlist or an offline `node_modules`).
- A UAT web host that can serve static files over HTTPS for `hawkuat.equitasuat.bank.in`
  (IIS, Nginx, Apache, or Azure App Service / Static Web Apps).
- The UAT SSL certificate installed on that host (handled by infra/IT — NOT stored in this repo).
- DNS: `hawkuat.equitasuat.bank.in` resolving to the UAT host.

---

## 2. Build the production bundle

From the project root:

```cmd
cd c:\Projects\stratospm_27Jul26
npm install
npm run build
```

- Output is written to the `dist/` folder.
- `dist/` contains `index.html` plus hashed JS/CSS assets — these are the files you deploy.
- No server-side runtime is required for the front-end; it is fully static.

> If npm SSL inspection (Zscaler) blocks install, temporarily use `npm config set strict-ssl false`
> for the install only, then set it back to `true`.

---

## 3. Deploy `dist/` to the UAT host

Pick the section matching your hosting platform.

### Option A — IIS (Windows Server)
1. Copy the entire contents of `dist/` to the site folder, e.g. `C:\inetpub\hawkuat`.
2. In IIS Manager, create/point a Site at that folder.
3. Add an HTTPS binding on port 443 for host name `hawkuat.equitasuat.bank.in` and select the UAT SSL certificate.
4. Add a URL Rewrite rule so client-side routing falls back to `index.html` (SPA fallback):
   - Install the "URL Rewrite" module if not present.
   - Rule: if the requested path is not an existing file/folder, rewrite to `/index.html`.
5. Ensure the MIME type for `.js`/`.mjs` is `text/javascript` (modern IIS already handles this).

### Option B — Nginx
1. Copy `dist/` to e.g. `/var/www/hawkuat`.
2. Server block:
   ```nginx
   server {
       listen 443 ssl;
       server_name hawkuat.equitasuat.bank.in;

       ssl_certificate     /path/to/uat-fullchain.crt;   # installed by infra
       ssl_certificate_key /path/to/uat-private.key;     # SECRET — infra only

       root /var/www/hawkuat;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;   # SPA fallback
       }
   }
   ```
3. `nginx -t && systemctl reload nginx`.

### Option C — Azure App Service / Static Web Apps
1. Deploy the contents of `dist/` (or connect the repo build pipeline producing `dist/`).
2. Add the custom domain `hawkuat.equitasuat.bank.in` and bind the UAT TLS certificate.
3. Configure SPA fallback to `index.html` (Static Web Apps does this via `staticwebapp.config.json`).

---

## 4. Azure AD (Entra ID) SSO configuration — REQUIRED for "Sign in with Microsoft"

In the **HawkPM** app registration → Authentication → **Single-page application** platform,
register these exact redirect URIs (bare origin, no trailing slash):

```
https://hawk.equitas.bank.in
https://hawkuat.equitasuat.bank.in
http://localhost:3000
```

- The app resolves its redirect URI from `window.location.origin` at runtime,
  so no code change is needed per environment — only registration.
- Without the UAT URI registered, SSO fails with `redirect_uri_mismatch`.
- Ensure delegated Graph permission `User.Read` is granted.

App registration reference:
- Client ID: `a8bb89d9-c5d0-450c-b536-b8cbe0bd70cc`
- Tenant ID: `e22e4eaa-623f-4164-abb8-ac89a5a17e13`
- Authority: `https://login.microsoftonline.com/e22e4eaa-623f-4164-abb8-ac89a5a17e13`

---

## 5. Smoke test on UAT

1. Open **https://hawkuat.equitasuat.bank.in** — the login screen should load over HTTPS (valid cert, no warning).
2. Refresh on a deep route (e.g. after navigating) to confirm the SPA `index.html` fallback works.
3. Click **Sign in with Microsoft** → should redirect to Microsoft login and back into the dashboard.
4. Verify role behaviour (mock logins still available for testing): admin can Request Deletion,
   superadmin sees Pending Approvals with Approve/Reject, Archived tab shows Restore / Delete Forever.

---

## 6. Notes & caveats

- **Data storage:** this build persists projects in the browser's `localStorage`. Data is per-browser/per-device
  and does not sync between users. For shared UAT data you would need a backend/database (not in scope here).
- **Secrets:** never commit the SSL private key or `.pfx` to this repo. Certificates live on the host only.
- **Rebuild on change:** any code change requires `npm run build` and re-copying `dist/` to the host.
