# Shared utilities spec (Spotting)

Clean-room reimplementation requirements for `@spotting/shared` helpers.

## Error reporting (`lib/errors.ts`)

- `reportNonFatalError(context, error, options?)` logs a console warning prefixed with `[Spotting non-fatal]`.
- When `options.once` is true, each `context` string logs at most once per session.
- `isErrorWithCode(error, code)` returns true for `Error` instances whose `code` property matches.

## PostHog (`lib/posthog.ts`)

- `initPostHog({ key?, host? })` initializes PostHog when both key and host are non-empty.
- Proxy API requests through `/ph`; pass `ui_host` from config.

## Pagination config (`config/pagination.ts`)

- Defaults: page 1, page size 10, max page size 100.
- Page size options: 10, 20, 30, 40, 50.

## Pagination server (`lib/server/pagination.ts`)

- Zod schema for optional `{ page?, perPage? }`.
- `normalizePaginationParams` returns `{ page, perPage, offset, limit }` with sane floors.
- `buildPaginationMeta(totalCount, page, perPage)` returns cursor metadata with clamped page index.

## Unique violation retry (`lib/server/retry-on-unique-violation.ts`)

- Retry async operations up to 3 times when Postgres error code `23505` is detected.

## UI placeholders (`config/placeholders.ts`)

- Export human-readable empty-state strings for tables and detail panels.
