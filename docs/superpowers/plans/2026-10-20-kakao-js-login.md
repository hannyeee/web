# Kakao JavaScript SDK Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure Kakao JS SDK v2 login using only Kakao ID and nickname while preserving local email/password login.

**Architecture:** The Vue login view initializes the Kakao JS SDK and starts an authorization-code flow. FastAPI issues and checks an OAuth state cookie, exchanges the authorization code server-side, retrieves Kakao ID and nickname, persists an identity in SQLite, issues `EN_AT`, and redirects to the board. A transaction-safe SQLite migration makes email/password optional for provider-only users while preserving local rows.

**Tech Stack:** Vue 3, Vite, Jest, FastAPI, SQLAlchemy, SQLite, pytest, Kakao JavaScript SDK v2.

**Spec:** `docs/superpowers/specs/2026-10-20-kakao-js-login-design.md`

## Global Constraints

- Request and store only Kakao's app-scoped user ID and nickname; never request email.
- Identify Kakao users only by unique Kakao ID; do not link accounts by nickname or email.
- Keep local signup/login behavior and the `EN_AT` HTTP-only session cookie working.
- Keep keys out of tracked files; use `VITE_KAKAO_JS_KEY` in the frontend and `KAKAO_REST_API_KEY` in backend configuration.
- Preserve all existing local user rows and keep unrelated workspace changes out of the implementation.

## Review Focus

- State cookie attributes and callback validation must work across the Kakao redirect and Vite `/api` proxy.
- SQLite table rebuilding must preserve existing rows and remain safe when startup sees an already migrated database.
- Duplicate Kakao callbacks must not create duplicate users when `kakao_id` is unique.
- Kakao failures and user cancellation must never issue a session cookie or leave a partial user.
- Local login must continue to work for records with non-null email/password after migration.

## File Structure

- `app/models/user.py`: nullable email/password and unique nullable Kakao ID.
- `app/db/migrations/`: explicit, idempotent SQLite migration for the existing `user` table.
- `app/db/database.py`: run the migration before ORM startup uses the updated schema.
- `app/core/config.py`: backend Kakao REST API configuration.
- `app/services/kakao.py`: server-side token exchange and user-info lookup, isolated for HTTP mocking.
- `app/api/routers/user.py`: state endpoint and OAuth callback; retain local routes.
- `app/core/security.py`: stop printing the JWT signing secret when creating a token.
- `frontend/src/lib/kakao.js`: load and initialize Kakao JS SDK v2 once.
- `frontend/src/views/LoginView.vue`: Kakao login button, SDK authorization start, and error display.
- `frontend/test/App.spec.js` and a focused `frontend/test/kakao.spec.js`: Jest behavior coverage.
- `tests/conftest.py`, `tests/test_kakao_login.py`, `tests/test_user_migration.py`: isolated database and API behavior coverage.
- `.env.local`: document placeholders; `.gitignore` already excludes `../../../.worktrees/.env` and `.env.*` while allowing the placeholder file.

## Tasks

### Task 1: Add and verify the SQLite user migration

**Files:** `app/models/user.py`, `app/db/migrations/`, `app/db/database.py`, `tests/conftest.py`, `tests/test_user_migration.py`.

- [ ] Write pytest cases creating a legacy SQLite `user` table and row, applying the migration, and asserting the row's `idx`, `email`, `password`, and `name` are unchanged while `kakao_id` is nullable/unique and `email`/`password` accept null.
- [ ] Add a repeat-run test proving the migration safely recognizes an already migrated schema.
- [ ] Implement a transactional migration that rebuilds only the `user` table and copies legacy rows without data loss; expose a single migration entry point and call it before `Base.metadata.create_all`.
- [ ] Update the ORM model to match the resulting schema and verify the targeted migration tests pass with `.venv\Scripts\python -m pytest tests/test_user_migration.py`.

### Task 2: Implement and test the Kakao provider HTTP boundary

**Files:** `app/core/config.py`, `app/services/__init__.py`, `app/services/kakao.py`, `tests/test_kakao_provider.py`, `.env.local`.

- [ ] Write tests with a mocked HTTP transport for successful code exchange and user-info lookup, malformed provider responses, rejected codes, and Kakao API errors.
- [ ] Implement server-side code exchange at Kakao's token endpoint using `KAKAO_REST_API_KEY`, `KAKAO_REDIRECT_URI`, and only configured values; then call `/v2/user/me` with the access token.
- [ ] Return only the Kakao ID and `kakao_account.profile.nickname` from the provider adapter; request the nickname profile field, omit email from `property_keys`, and map a missing nickname to the fallback defined in the design.
- [ ] Add optional backend settings for `KAKAO_REST_API_KEY` and `KAKAO_REDIRECT_URI`, and placeholders for those plus `VITE_KAKAO_JS_KEY` and `VITE_KAKAO_REDIRECT_URI` in `.env.local`; keep real local values in the already ignored `../../../.worktrees/.env` files and set both redirect URI values identically.
- [ ] Run `.venv\Scripts\python -m pytest tests/test_kakao_provider.py` and confirm the adapter test makes no live Kakao requests.

### Task 3: Add the FastAPI OAuth state and account callback flow

**Files:** `app/api/routers/user.py`, `app/core/security.py`, `tests/test_kakao_login.py`, `tests/conftest.py`.

- [ ] Write failing API tests for state generation/cookie attributes, missing or mismatched state, provider failure, new Kakao account, repeat login by Kakao ID, no email field requested or accepted, and local login compatibility.
- [ ] Add `POST /api/user/kakao/state` to return a cryptographically random state and set a short-lived HttpOnly, SameSite=Lax cookie.
- [ ] Add `GET /api/user/kakao/callback` to validate state before calling the provider adapter, find or create by Kakao ID, issue `EN_AT`, clear state cookie, and redirect to `/board`; redirect errors to `/login` without issuing a session or creating a partial user.
- [ ] Keep local signup and login schemas requiring email/password and update local login lookup/token creation to work with nullable fields without changing its public request contract.
- [ ] Remove the signing-key print from `createToken` and use the stable internal user ID as Kakao session subject while preserving local login subject compatibility.
- [ ] Run `.venv\Scripts\python -m pytest tests` and verify all Kakao and existing local-user tests pass.

### Task 4: Add Vue Kakao SDK login UI and Jest coverage

**Files:** `frontend/src/lib/kakao.js`, `frontend/src/views/LoginView.vue`, `frontend/index.html`, `frontend/test/kakao.spec.js`, `frontend/test/App.spec.js`.

- [ ] Write Jest cases for loading/initializing the SDK once, disabled/loading button state, request parameters without email scope, and surfaced provider cancellation/failure.
- [ ] Load the current Kakao JavaScript SDK v2, initialize from `import.meta.env.VITE_KAKAO_JS_KEY`, call the backend state endpoint, then invoke `Kakao.Auth.authorize()` with `scope: 'profile_nickname'`, the returned state, and `import.meta.env.VITE_KAKAO_REDIRECT_URI`.
- [ ] Add a Kakao login button and accessible busy/error messaging while preserving the existing email/password form and navigation.
- [ ] Update shared test mocks only as needed and run `npm test -- --runInBand` in `frontend` plus `npm run build`.

### Task 5: Configure the Kakao app and verify the complete flow

**Files:** Kakao Developers console app `1614700`; local untracked environment files only.

- [ ] Use Chrome DevTools to enable Kakao Login, set the nickname consent item only, register `http://localhost:5173` and `http://localhost:5173/api/user/kakao/callback`, and read the public JavaScript key and REST API key into ignored local configuration. Do not enable email consent.
- [ ] If the app's current status blocks a setting, capture the exact blocker and leave that unsupported setting unchanged.
- [ ] Run the complete backend and frontend test suites plus the frontend production build.
- [ ] Perform a live browser login with a Kakao test account and confirm first signup, repeated login, logout/session behavior, and no email request; report this separately from mocked/local test evidence.

## Execution Notes

The Kakao provider HTTP boundary will be exercised in the implementation using the Postman `api-simulation` workflow against a local mock of Kakao's token and user-info endpoints; no real Kakao credentials are used in automated tests. The actual browser login is the only live-provider check.
