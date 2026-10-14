# AWS Hosting Prerequisites — HawkPM (EquitasPM)

**Prepared for:** AWS Cloud Support / Platform team
**Prepared by:** Application team (HawkPM)
**Purpose:** Provision the AWS resources required to host the HawkPM front-end application in the organization's AWS account, including SSL, DNS, and a CI/CD pipeline, so the application team can push code and manage releases.

---

## 1. Application summary (what is being hosted)

| Item | Detail |
|------|--------|
| Application | HawkPM (EquitasPM) — Project Management portal |
| Type | **Static Single-Page Application (SPA)** — React + Vite |
| Build command | `npm install` then `npm run build` |
| Build output | `dist/` folder (static HTML/JS/CSS only) |
| Server-side runtime | **None** — no Node/app server needed in production; it is pure static content |
| Data store | Browser `localStorage` today (no backend/database in current scope) |
| Authentication | Microsoft Entra ID (Azure AD) SSO via MSAL — browser-side only; no server secret |

> Because it is a static SPA, the recommended AWS pattern is **S3 (origin) + CloudFront (CDN/TLS) + ACM (certificate) + Route 53 (DNS)**, with **CodePipeline + CodeBuild** for CI/CD. No EC2, ECS, or Lambda is required for the front-end.

---

## 2. Target environments & URLs

| Environment | URL | Notes |
|-------------|-----|-------|
| UAT | `https://hawkuat.equitasuat.bank.in` | First to provision |
| Production | `https://hawk.equitas.bank.in` | Same pattern, separate bucket/distribution |

Please provision **UAT first**, mirrored later for Production.

---

## 3. AWS resources requested (per environment)

### 3.1 Amazon S3 — static website origin
- One private S3 bucket per environment (e.g. `hawkuat-equitas-web`, `hawk-equitas-web`).
- Block all public access (serve only via CloudFront using Origin Access Control).
- Versioning enabled (for rollback).
- Default document: `index.html`.

### 3.2 Amazon CloudFront — CDN + HTTPS + SPA routing
- One CloudFront distribution per environment, origin = the S3 bucket (via **Origin Access Control / OAC**).
- Viewer protocol policy: **Redirect HTTP to HTTPS**.
- **SPA fallback (critical):** custom error responses mapping **403 and 404 → `/index.html` with HTTP 200**, so client-side routes and page refreshes work.
- Compression enabled. Default root object: `index.html`.
- Alternate domain name (CNAME): the environment URL from Section 2.

### 3.3 AWS Certificate Manager (ACM) — SSL/TLS
- A certificate covering the environment hostname (`hawkuat.equitasuat.bank.in`, and `hawk.equitas.bank.in` for prod).
- **Must be issued/imported in the `us-east-1` region** (CloudFront requirement), regardless of where other resources live.
- The application team can provide the organization-issued certificate for import, **or** ACM can issue one via DNS validation if the org allows. Please advise which path to use.
- *(Private keys will be handled by the cloud team through ACM import — never shared via email/chat or stored in the code repository.)*

### 3.4 Amazon Route 53 (or corporate DNS) — domain
- DNS record for each hostname pointing (alias) to the CloudFront distribution.
- If the DNS zone `equitasuat.bank.in` / `equitas.bank.in` is managed outside Route 53 (corporate DNS), please advise the process to add the CNAME/alias to the CloudFront domain.

### 3.5 CI/CD — CodePipeline + CodeBuild (recommended)
- **Source stage:** connect to the application's Git repository (branch per environment, e.g. `uat`, `main`). Please advise the supported source (CodeCommit, GitHub via CodeStar connection, Bitbucket, etc.).
- **Build stage (CodeBuild):** Node.js build image; runs `npm ci` (or `npm install`) and `npm run build` to produce `dist/`.
- **Deploy stage:** sync `dist/` to the environment S3 bucket, then create a CloudFront invalidation (`/*`) so new assets are served immediately.
- A `buildspec.yml` can be committed to the repo by the application team — see Section 6 for a reference.
- Alternatively, if a pipeline is not available initially, grant the application team scoped permissions for a **manual deploy** (Section 5) so releases are not blocked.

---

## 4. Networking / security considerations to confirm

Please confirm the following so we can plan correctly:

1. **Public vs. internal access:** Should these URLs be reachable only on the corporate network/VPN, or publicly on the internet? (This affects whether CloudFront is public, WAF-restricted by IP, or fronted by an internal setup.)
2. **WAF:** Is AWS WAF required in front of CloudFront per org policy? If so, which managed rule groups / IP allowlists?
3. **Zscaler/proxy:** Corporate egress is via Zscaler. Confirm that the build environment (CodeBuild or the developer machine) can reach the npm registry (`registry.npmjs.org`) and AWS endpoints.
4. **Logging:** Enable CloudFront + S3 access logs to a designated log bucket per org standard.
5. **Tagging / account:** Which AWS account and tagging standard (cost center, environment, owner) should these resources use?

---

## 5. Access the application team needs (for code push / manual deploy)

To let the application team deploy builds, please provide **one** of the following (least-privilege preferred):

**Option A — Pipeline-driven (preferred):** repo access + pipeline triggers on push. Team never touches AWS directly.

**Option B — Scoped IAM for manual deploy:** an IAM role/user (via SSO/federation if available) with permissions limited to:
- `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the environment bucket only.
- `cloudfront:CreateInvalidation` on the environment distribution only.

With Option B, the team deploys with:
```
aws s3 sync ./dist s3://<env-bucket> --delete
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```

---

## 6. Reference build spec (CodeBuild) — provided by app team

```yaml
version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - npm ci
  build:
    commands:
      - npm run build        # outputs to dist/
artifacts:
  base-directory: dist
  files:
    - '**/*'
```

---

## 7. Microsoft Entra ID (SSO) — informational (handled by app/identity team)

Not an AWS task, but noted so URLs stay consistent. The following redirect URIs must be registered in the
Entra ID app registration (SPA platform). The application team will handle this:
```
https://hawkuat.equitasuat.bank.in
https://hawk.equitas.bank.in
```
The app reads its redirect URI from the browser origin at runtime, so no per-environment code change is needed.

---

## 8. What we need back from the AWS team (checklist)

Please provision UAT and share:

- [ ] S3 bucket name (UAT)
- [ ] CloudFront distribution ID + distribution domain name (UAT)
- [ ] Confirmation that SPA fallback (403/404 → `/index.html`, 200) is configured
- [ ] ACM certificate status for `hawkuat.equitasuat.bank.in` (and the chosen issue/import path)
- [ ] DNS record created (hostname → CloudFront) and confirmation it resolves
- [ ] CI/CD: pipeline name + source connection details, **or** the scoped IAM role/credentials for manual deploy (Option B)
- [ ] Answers to the Section 4 confirmations (public/internal, WAF, logging, account/tags)
- [ ] Repeat for Production when UAT is validated

---

## 9. Summary diagram (logical)

```
Developer / Git repo
        │  (push)
        ▼
  CodePipeline ──► CodeBuild (npm ci && npm run build → dist/)
        │
        ▼
     S3 bucket  ◄── (private, OAC)
        │
        ▼
   CloudFront (TLS via ACM, SPA 403/404→index.html)
        │
        ▼
   Route 53 / DNS  →  https://hawkuat.equitasuat.bank.in
```
