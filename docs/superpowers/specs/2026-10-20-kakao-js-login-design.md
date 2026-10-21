# Kakao JavaScript SDK Login Design

## Goal and constraints

Add Kakao login to the existing Vue 3 and FastAPI application. Kakao login must use the Kakao JavaScript SDK and request only the Kakao user ID and nickname. Kakao email is not available and must not be requested. Therefore, this flow cannot detect or reject a Kakao account because its email matches a local account. Kakao identity is matched by Kakao's stable app-scoped user ID; nickname is stored as the display name and is not an identity key.

The existing local email/password login remains available. Successful local or Kakao login issues the existing `EN_AT` HTTP-only cookie and navigates to the board.

## Current project state

- `frontend/src/views/LoginView.vue` contains the local login form; the project uses Vue 3 and Vite.
- `app/api/routers/user.py` contains local signup and login routes.
- `app/models/user.py` requires `email` and `password`; it has no Kakao identity.
- `app/main.py` creates tables with `Base.metadata.create_all`, which does not migrate existing SQLite columns.
- Vite proxies `/api` to `http://127.0.0.1:8000`.
- Kakao Developers app `1614700` (`mlops`) currently reports Kakao Login and consent items as not configured.
- There are unrelated existing workspace changes in `frontend/src/App.vue`, `frontend/src/views/BoardListView.vue`, `frontend/dist/`, and `frontend/public/`. They are outside this feature.

## Authentication flow

Use Kakao JavaScript SDK v2 and its supported `Kakao.Auth.authorize()` authorization-code flow. SDK v2 does not provide the older popup flow that exposed an access token directly to the browser. The browser calls a same-origin backend start endpoint to obtain a random OAuth `state`; the backend stores the expected state in a short-lived, HTTP-only, SameSite=Lax cookie. Vue then initializes the SDK with the public JavaScript key and calls `authorize()` with that state and the callback URI.

Kakao redirects the browser to the backend callback path through the existing `/api` proxy. FastAPI compares the returned state with the cookie, exchanges the authorization code server-side, and calls Kakao's user information API using the returned access token. It requests and consumes only the Kakao user ID and `kakao_account.profile.nickname`; it does not request email. The server then finds or creates a user by the unique Kakao ID, issues `EN_AT`, clears the temporary state cookie, and redirects to `/board`. A cancelled or failed Kakao login returns the browser to `/login` with an actionable error state and does not issue a service cookie.

The app has no deployed frontend origin recorded in this repository. Configure the local Vite origin and local callback URI for development; production origins must be registered when supplied by deployment configuration.

## Data model and compatibility

Keep one application user record per person. Make `email` and `password` nullable for Kakao-only accounts and add a nullable, unique `kakao_id` field. Existing local users and their current email, password, and name values must survive the SQLite migration unchanged. Local signup and login continue to require email and password. Kakao-created users store Kakao's nickname in `name`, with a safe fallback when Kakao omits it.

Because `create_all` cannot alter an existing table, add an explicit SQLite migration that rebuilds the `user` table transactionally while preserving existing rows and indexes. It must be safe to rerun or clearly fail if already applied. Do not associate or merge a Kakao account with a local account based on nickname or an unavailable email.

## API contract

- `POST /api/user/kakao/state` returns `{ "state": "<random value>" }` and sets a short-lived HTTP-only state cookie. No Kakao credentials or identity data are accepted in this request.
- `GET /api/user/kakao/callback?code=...&state=...` is the registered redirect URI. It validates state, performs server-to-server token and user-info requests, creates or finds the local user, sets `EN_AT`, and redirects to `/board` on success or `/login` on failure.
- Invalid state, rejected authorization codes, Kakao API errors, and missing Kakao ID are rejected without creating a user or setting `EN_AT`.
- Kakao API calls use configured keys from environment variables. The JavaScript key is public and exposed to Vite as `VITE_KAKAO_JS_KEY`; the REST API key remains backend configuration (`KAKAO_REST_API_KEY`). No key is committed to the repository.

## Kakao Developers configuration

For app `1614700`, enable Kakao Login, configure nickname/profile consent only, register the local Vite web origin, and register the local callback URI. Do not enable or request the email consent item. Read the existing JavaScript key from the app's Platform Key screen into local environment configuration; do not place a key literal in tracked source. If Kakao does not permit the requested local settings with this app's current status, record the exact console blocker and leave the app unchanged.

## Failure and security behavior

- OAuth state is random, short-lived, HttpOnly, SameSite=Lax, and checked before exchanging the authorization code.
- Authorization code exchange and user-info lookup happen on the backend; the browser never sends a trusted Kakao ID or nickname as proof of identity.
- Provider errors fail closed and do not create partial accounts.
- Use Kakao's app-scoped user ID as the unique identity; never use the editable nickname as a key.
- Keep the existing local session-cookie behavior. Remove the existing secret-key print from `createToken` because issuing a Kakao session would otherwise log the signing secret.

## Verification

Add pytest coverage for state mismatch, Kakao API/token failures, nickname-only account creation, repeat login by Kakao ID, and local login compatibility using a test database and a mocked Kakao HTTP boundary. Add Jest coverage for SDK loading/initialization, consent/request scope excluding email, click behavior, and visible cancellation/error states. Run the complete backend pytest suite and frontend Jest suite, plus the frontend production build. A real Kakao consent/login round trip is separate live evidence and depends on the developer-console app settings and a Kakao test account.

## Official references

- [Kakao Login JavaScript SDK](https://developers.kakao.com/docs/ko/kakaologin/js)
- [Kakao Login REST API](https://developers.kakao.com/docs/ko/kakaologin/rest-api)
- [JavaScript SDK v1 to v2 migration](https://developers.kakao.com/docs/en/javascript/migration)
- [Kakao Login prerequisites](https://developers.kakao.com/docs/ko/kakaologin/prerequisite)

The v2 flow and backend token exchange follow Kakao's current SDK guide. Kakao documents that JavaScript SDK v2 uses `Kakao.Auth.authorize()`, while the server exchanges the returned authorization code for tokens and uses the access token to retrieve the app-scoped user ID and permitted profile fields.
