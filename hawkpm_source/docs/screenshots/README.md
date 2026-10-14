# SOP Screenshots

Capture these screens from the running app and save each one in **this folder**
(`docs/screenshots/`) using the **exact filename** below. The SOP
(`docs/SOP-project-management.html`) loads them automatically — any missing image
simply hides its slot, so you can fill them in over time.

## How to capture
1. Run the app: `npm run dev` -> open `http://localhost:3000`.
2. Use Windows **Snipping Tool** (Win+Shift+S) to grab each screen.
3. Save as **PNG** with the exact name listed.
4. Re-open the SOP HTML in your browser — the screenshots appear inline. Then "Save as PDF".

> Tip: capture at a consistent window width (e.g. ~1280px) so the images look uniform.

## Required files

| File | What to capture | Login as |
|------|------------------|----------|
| `01-login.png` | Login screen: User ID/password form + "Sign in with Microsoft" button | (logged out) |
| `02-create-overview.png` | Create Project dialog — Project Overview section (shows reserved EP ID) | admin |
| `03-create-stakeholders.png` | Create Project dialog — Key Stakeholders & Permissions rows | admin |
| `04-project-details.png` | Project Details in edit mode (overview + requirements) | admin |
| `05-timeline.png` | Timeline grid with version history + Risks & Delays | admin |
| `06-request-deletion.png` | "Request Deletion" button + reason/confirmation prompt | admin |
| `07-pending-banner.png` | Project Details with the amber "Pending Deletion" banner | admin |
| `08-pending-approvals.png` | Pending Approvals tab with a request row + Approve/Reject | superadmin |
| `09-archived-tab.png` | Archived Projects tab with Restore + Delete Forever buttons | superadmin |
| `10-rag-status.png` | Dashboard RAG dropdown + RAG summary cards / pie chart | admin |
| `11-export-menu.png` | Export Report menu with format options | any |

## Suggested capture sequence (to generate the states)
1. Log out -> capture **01**.
2. Log in as `admin` -> Create Project -> capture **02**, **03**.
3. Open a project -> capture **04**, **05**, **10** (RAG dropdown), **11** (export menu).
4. Request deletion on a test project -> capture **06**, **07**.
5. Log out, log in as `superadmin` -> Pending Approvals -> capture **08**.
6. Approve the request -> Archived tab -> capture **09**.

All test logins use password `password123`.
