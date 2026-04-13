# Progress Log

## Summary
- The dashboard started as a monitoring board for `Server / Schedule / DB` health.
- In this change, that health-check architecture was removed completely.
- The product is now a simpler project directory that stores and shows basic project information only.

## Phase 12 - Backend Simplification
- Removed outbound health-check behavior from [server/app.js](C:\Users\JIREH\app\project-dashboard\server\app.js).
- Removed the manual monitor endpoint and the heartbeat route connection.
- Simplified [server/routes/projects.js](C:\Users\JIREH\app\project-dashboard\server\routes\projects.js) so projects only save:
  - `name`
  - `description`
  - `outputFormat`
  - `serverLocation`
  - `url`
  - `techStack`
- Simplified [server/lib/dataStore.js](C:\Users\JIREH\app\project-dashboard\server\lib\dataStore.js) so project reads/writes strip old status fields.
- Deleted orphaned monitor-related files:
  - `server/routes/heartbeat.js`
  - `server/services/monitorService.js`
  - `server/services/dailyReportService.js`

### Success
- The server no longer contains live project monitoring flow.
- No backend route now sends requests to project URLs or health endpoints.

### Next
- Update the project form and Projects table to match the simpler data model.

## Phase 13 - Frontend Simplification
- Simplified [AddEditModal.jsx](C:\Users\JIREH\app\project-dashboard\client\src\components\AddEditModal.jsx) to remove:
  - `Health Endpoint`
  - `Has Schedule`
  - `Has DB`
  - `Schedule Interval`
- Updated [ProjectsPage.jsx](C:\Users\JIREH\app\project-dashboard\client\src\pages\ProjectsPage.jsx) table columns.
- Updated [ProjectRow.jsx](C:\Users\JIREH\app\project-dashboard\client\src\components\ProjectRow.jsx) to display:
  - `Server Location`
  - `URL`
- Rebuilt [ProjectAccordion.jsx](C:\Users\JIREH\app\project-dashboard\client\src\components\ProjectAccordion.jsx) with the simplified detail view.
- Removed the unused [StatusLight.jsx](C:\Users\JIREH\app\project-dashboard\client\src\components\StatusLight.jsx) component.
- Simplified [SettingsPage.jsx](C:\Users\JIREH\app\project-dashboard\client\src\pages\SettingsPage.jsx) so it only manages Telegram connection settings.

### Success
- The Projects screen no longer shows `Server / Schedule / DB / Latest Update`.
- The table now shows `Server Location` and `URL`.
- The add/edit modal only asks for current project information.

### Next
- Verify the simplified code path with build and syntax checks.
- Rewrite the handoff document so it explains the new, simpler architecture.

## Phase 14 - Verification And Documentation
- Verified frontend production build with:
  - `npm.cmd run build`
- Verified server file syntax with:
  - `node --check server\\app.js`
  - `node --check server\\routes\\projects.js`
  - `node --check server\\routes\\settings.js`
  - `node --check server\\lib\\dataStore.js`
  - `node --check server\\services\\telegramService.js`
- Rewrote [FORCodex.md](C:\Users\JIREH\app\project-dashboard\FORCodex.md) to explain the current architecture in plain language.

### Success
- Frontend build passes.
- Server entry files pass syntax validation.
- The project explanation now matches the current implementation.

### Next
- If needed later, clean or archive legacy planning documents such as `PLAN.md` and `MONITORINGMETHOD.md` so they do not describe removed features.

## Phase 15 - Admin URL Support
- Added `adminUrl` to [server/routes/projects.js](C:\Users\JIREH\app\project-dashboard\server\routes\projects.js) so create and update requests save the new field.
- Added `adminUrl` to [server/lib/dataStore.js](C:\Users\JIREH\app\project-dashboard\server\lib\dataStore.js) so project normalization keeps the value instead of stripping it out.
- Updated [AddEditModal.jsx](C:\Users\JIREH\app\project-dashboard\client\src\components\AddEditModal.jsx) to include a new `URL(Admin)` input for both add and edit flows.
- Updated [ProjectsPage.jsx](C:\Users\JIREH\app\project-dashboard\client\src\pages\ProjectsPage.jsx) so the Projects table now shows `URL(Admin)` between `URL` and `Edit`.
- Updated [ProjectRow.jsx](C:\Users\JIREH\app\project-dashboard\client\src\components\ProjectRow.jsx) so each row renders the admin link.
- Updated [ProjectAccordion.jsx](C:\Users\JIREH\app\project-dashboard\client\src\components\ProjectAccordion.jsx) so the expanded detail card also shows `URL(Admin)` and the wider table layout stays aligned.

### Success
- A project can now store both a public `URL` and a separate `URL(Admin)`.
- The new admin URL survives refresh because both the frontend and backend understand the field.
- The table layout still aligns correctly after adding the new column.

### Next
- Verify the frontend build and server syntax checks after the new field addition.

## Phase 16 - Verification And Handoff Refresh
- Verified frontend production build with:
  - `npm.cmd run build`
- Verified server syntax with:
  - `node --check app.js`
  - `node --check routes\\projects.js`
  - `node --check lib\\dataStore.js`
- Rewrote [FORCodex.md](C:\Users\JIREH\app\project-dashboard\FORCodex.md) so it now explains the current project structure and the new `URL(Admin)` field in plain Korean.

### Success
- Frontend build passes after the new column and form field were added.
- The backend files touched by this change pass syntax validation.
- The handoff document now matches the current saved project shape.

### Next
- If you later want stricter data quality, add URL format validation for `URL` and `URL(Admin)`.
