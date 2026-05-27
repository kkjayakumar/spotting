# Spotting public report viewer (`/s/[id]`)

Clean-room specification for the share-link report viewer.  
**Implementation:** `apps/web/src/features/report-viewer/`  
**Attestation:** No Crikket source used during Phase 2 rewrite.

---

## Layout

| Region | Component | Behavior |
|--------|-----------|----------|
| Header | `ReportViewerHeader` | Title, status badge, created date, edit action, home link |
| Main (desktop) | Resizable split | Recording stage (left) + inspector sidebar (right) |
| Main (mobile) | Stacked | Optional collapsible video + full-height sidebar |
| Banner | `IngestionStatusBanner` | Shown to editors when submission/debugger ingest incomplete |

## Recording stage

- Video attachment: HTML5 player with controls; emits playback offset (ms) on `timeupdate`
- Screenshot: interactive zoom/pan viewer
- Empty: placeholder when no attachment
- Metadata duration priming when browser omits `duration`

## Inspector sidebar tabs

| Tab | Content |
|-----|---------|
| **Details** | URL, device info, priority, reporter, org, description |
| **Steps** | Ordered reproduction steps from user actions |
| **Console** | Console log timeline rows |
| **Network** | Searchable request list + payload inspector |

Tab selection syncs to URL query `?tab=`.

## Timeline interaction

- Selecting a row highlights it and, when video is present, seeks players to entry offset
- During playback, entries within the same 100ms bucket highlight
- Console/actions/network maintain independent selection state per channel

## Network inspector

- Infinite scroll pagination (10 per page)
- Debounced search synced to `?networkSearch=`
- Detail sections: overview / request / response via `?networkSection=`
- Lazy-load request/response bodies via API

## States

| State | UI |
|-------|-----|
| Loading | Centered spinner |
| Not found | Error message + link home |
| Loaded | Full viewer |

## Accessibility

- Video toggle on mobile has `aria-label`
- Loading state uses `role="status"`
- Keyboard-focusable timeline rows

## Tests

- Playwright smoke: load share route (when fixture available)
- Manual: select timeline row → video seeks; tab URL sync; network search
