# Spotting dashboard reports list (`/dashboard`)

Clean-room specification for the protected reports grid, filters, bulk actions, and related settings helpers.  
**Implementation:** `apps/web/src/features/reports/dashboard/`  
**Attestation:** No Crikket source used during Phase 3 rewrite.

---

## Page shell

| Region | Component | Behavior |
|--------|-----------|----------|
| Header | Route `page.tsx` | Title, subtitle, wraps `SpottingReportsList` |
| Query bar | `ReportsQueryBar` | Search, sort, facet filters, stat chips |
| Selection bar | `SelectionActionBar` + `ReportsBulkEditor` | Shown when ≥1 card selected |
| Grid | `ReportGridCard` | Responsive card grid with infinite scroll sentinel |
| Empty / error | Inline states | Filter-aware empty copy; retry on fetch error |
| Dialogs | `ReportsRemovalDialogs` | Single + bulk delete confirmations |

## Data & URL state

- Infinite query: `GET /v1/reports?page=&pageSize=12`
- Stats: `GET /v1/reports/stats` (via `reportQueries.bugReport.getDashboardStats`)
- URL params (nuqs): `search`, `sort`, `statuses[]`, `priorities[]`, `visibilities[]`
- Search debounced (300ms) before syncing to URL
- Intersection observer on sentinel loads next page (`rootMargin: 300px`)

## Report card

| Area | Behavior |
|------|----------|
| Thumbnail | Image, screenshot URL, or video frame seek (~20% duration) |
| Overlay | Media type badge, duration for video |
| Selection | Checkbox stops link navigation |
| Menu | Copy share link, open tab, retry ingest, privacy, edit sheet, delete |
| Footer | Title, created date, visibility pill, description, status/priority/tags |

Share links use `/s/{id}`; copy blocked until submission status is `ready`.

## Bulk edit

Dialog fields: status, priority, visibility, comma-separated tags.  
At least one field required before apply. Deletes use separate confirmation.

## Settings helpers (Phase 3)

Relocated under `features/reports/dashboard/settings/`:

| Module | Purpose |
|--------|---------|
| `extract-request-error.ts` | Normalize unknown errors to user string |
| `capture-origin-parsing.ts` | Parse/format allowed capture origins |
| `org-role-display.ts` | Human-readable org role labels |
| `org-member-models.ts` | Member + invitation row types |
| `billing-plan-models.ts` | Billing card + plan option types |
| `new-capture-key-form.tsx` | Create-key form wrapper |

Route paths under `dashboard/settings/` re-export these modules.

## Backward compatibility

Legacy exports remain at `dashboard/_components/bug-reports/*` and `_hooks/*` as thin re-exports for incremental migration.
