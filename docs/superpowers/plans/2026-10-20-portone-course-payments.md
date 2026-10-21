# PortOne Course Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add five sample courses and enable authenticated one-time card checkout through PortOne V2 and Toss Payments new module.

**Architecture:** Keep the existing order API and expand its response with a server-generated PortOne payment ID. Add a small PortOne API client and an authenticated completion endpoint that verifies the upstream status, currency, and amount before marking an order paid. The Vue detail view launches the official browser SDK and a completion route confirms the payment; a repeatable command seeds the empty catalog.

**Tech Stack:** FastAPI, SQLAlchemy, SQLite, Pydantic, httpx, pytest, Vue 3, Vue Router, `@portone/browser-sdk/v2`, Jest, Vite.

**Spec:** `docs/superpowers/specs/2026-10-20-portone-course-payments-design.md`

## Global Constraints

- Preserve the `{ code, message, result }` response envelope and both `/api` and unprefixed routes.
- All order routes require the `EN_AT` cookie and derive buyer, amount, course title, payment ID, and state from server records.
- Use PortOne V2, Toss Payments new-module channel, KRW, and card (`CARD`) for paid orders.
- Never return `PORTONE_API_SECRET` to the frontend; use only empty credential placeholders in `.env.local`.
- Mark an order paid only after PortOne returns matching payment ID, `PAID`, `KRW`, and the exact order amount.
- Preserve existing orders and courses. The SQLite schema migration and sample seed command must be idempotent.
- Automated verification must use a mocked PortOne API and must not create a real charge.
- Run the full pytest suite, Jest suite, and Vite production build.

## Review Focus

- A forged or cross-user `order_id` / `payment_id` must not complete another buyer's order — cover in payment completion API tests.
- PortOne `FAILED`, `VIRTUAL_ACCOUNT_ISSUED`, wrong currency, wrong amount, or mismatched payment ID must leave the order unpaid — cover each status/field boundary in backend API tests.
- Duplicate completion after a successful payment must return the paid order without another state transition — cover with an idempotency test.
- An absent `PORTONE_API_SECRET`, missing public checkout settings, or upstream error must show a safe actionable failure without leaking credentials — cover service/API and frontend tests.
- Existing rows in the pre-payment SQLite schema and pre-existing course catalogs must survive migrations and seed runs — cover migration and seed repeatability tests.

## File Map

- `app/models/course_order.py`, `app/schemas/course_order.py`: store the PortOne payment ID and paid timestamp and expose paid order history.
- `app/db/migrations.py`, `app/main.py`: add the two nullable order columns to existing SQLite databases before request handling.
- `app/core/config.py`, `.env.local`, `../../../frontend/.env.local`: load the backend PortOne secret and document empty backend/frontend settings in their respective app roots.
- `app/services/portone.py`: retrieve a PortOne payment using the server-only secret; isolate the HTTP call for mock-transport tests.
- `app/api/routers/order.py`: create checkout orders, verify completion, preserve buyer-scoped history.
- `tests/test_course_payments.py`: cover migration, order lifecycle, upstream verification, errors, and history.
- `scripts/seed_courses.py`, `tests/test_course_seed.py`: add five published courses for a selected existing instructor only when the catalog is empty.
- `frontend/src/lib/portone.js`: isolate checkout invocation and return handling from Vue views.
- `frontend/src/views/CourseDetailView.vue`, `frontend/src/views/PaymentCompleteView.vue`, `frontend/src/views/OrderListView.vue`, `frontend/src/router.js`: launch checkout, confirm redirected results, and show paid state.
- `frontend/package.json`, `frontend/package-lock.json`: add the official PortOne V2 browser SDK.
- `frontend/test/portone.spec.js`, `frontend/test/CourseDetailView.spec.js`, `frontend/test/PaymentCompleteView.spec.js`, `frontend/test/OrderListView.spec.js`: cover SDK calls and customer-visible payment states.

---

### Task 1: Payment persistence, migration, and PortOne client

**Files:**
- Create: `app/db/migrations.py`
- Create: `app/services/__init__.py`
- Create: `app/services/portone.py`
- Modify: `app/models/course_order.py`
- Modify: `app/schemas/course_order.py`
- Modify: `app/core/config.py`
- Modify: `app/main.py`
- Create: `.env.local`
- Create: `../../../frontend/.env.local`
- Test: `tests/test_course_payments.py`

**Interfaces:**
- Produce `migrate_course_orders(engine) -> None`, safe to run repeatedly and adding nullable `payment_id` and `paid_at` columns to an existing SQLite table.
- Create a unique SQLite index for non-null `payment_id` values; the index creation must also be safe to repeat.
- Produce `PortoneClient(api_secret: str, base_url: str = "https://api.portone.io", transport: httpx.BaseTransport | None = None)` and `get_payment(payment_id: str) -> dict`; use `GET {base_url}/payments/{payment_id}` with `Authorization: PortOne <secret>`, raise a sanitized provider exception on non-2xx/network failures, and permit `httpx.MockTransport` injection.
- Extend `CourseOrder` with nullable unique `payment_id` and nullable UTC `paid_at`. Produce `OrderCreateRes` with optional `payment_id` for order creation, and `OrderRes` with optional `paid_at` for order history; history responses must omit `payment_id` entirely.
- Add optional `PORTONE_API_SECRET` and `PORTONE_API_BASE_URL` configuration. Default the URL to `https://api.portone.io`; an absent secret is handled by the API as HTTP 503.

- [x] **Step 1: Write migration and provider client tests**

Assert migration adds both columns to a legacy SQLite `course_order` and succeeds on a second run. Assert the client sends the PortOne authorization header and encoded payment ID; returns a successful JSON payload; and converts timeout/non-2xx responses to a sanitized error.

- [x] **Step 2: Run focused tests and confirm they fail for the missing fields/client**

Run: `pytest tests/test_course_payments.py -q`
Expected: FAIL because the migration, model fields, and client are not implemented.

- [x] **Step 3: Implement migration, model/schema fields, and PortOne client**

Keep the provider client independent of FastAPI and inject `httpx.MockTransport` for deterministic tests. Invoke the idempotent migration from app startup after `Base.metadata.create_all`.

- [x] **Step 4: Run focused tests**

Run: `pytest tests/test_course_payments.py -q`
Expected: migration and provider client tests pass; existing orders remain readable.

### Task 2: Authenticated order checkout and payment verification API

**Files:**
- Modify: `app/api/routers/order.py`
- Modify: `app/schemas/course_order.py`
- Test: `tests/test_course_payments.py`
- Test: `tests/test_course_store_api.py`

**Interfaces:**
- Keep `POST /order/register` request `{ "course_id": positive_integer }`; for positive prices return 201 with order fields and a server-generated unique `payment_id` shaped `course-{order.idx}-{uuid.hex}` (within Toss Payments' 64-character limit). For zero price create `status: "paid"`, `paid_at`, and no provider payment ID.
- Produce authenticated `POST /order/complete` with request `{ "order_id": positive_integer, "payment_id": string }`; return the verified order. Scope lookup by both `order_id` and `buyer_id`.
- Call `PortoneClient.get_payment(payment_id)` and mark paid only if the stored ID matches, upstream status is `PAID`, currency is `KRW`, and `amount.total` equals the order snapshot. A previously paid order returns the same paid representation idempotently.
- Return 404 for absent/foreign orders, 409 for payment ID/status/currency/amount mismatch, 503 for missing API secret, and 502 for PortOne transport or HTTP failures. Do not expose upstream payloads or secrets.
- Keep `GET /order/list` buyer-scoped, include optional `paid_at`, and omit `payment_id`.

- [x] **Step 1: Write failing order lifecycle API tests**

Cover positive-price checkout ID uniqueness and server-owned values; zero-price order completion without a provider call; authenticated completion success; each payment ID/status/currency/amount mismatch; missing secret; provider failure; foreign/missing order; idempotent repeat; and paid order history without `payment_id`.

- [x] **Step 2: Run focused tests and confirm the payment routes/fields fail**

Run: `pytest tests/test_course_payments.py tests/test_course_store_api.py -q`
Expected: new completion, payment ID, and paid timestamp assertions fail while the pre-existing course/order guarantees remain intact.

- [x] **Step 3: Implement the order lifecycle endpoints**

Use an injectable `get_portone_client` dependency so API tests can supply a fake client. Persist state in one transaction after all upstream checks pass. Ignore client-supplied buyer, amount, title, and status.

- [x] **Step 4: Run backend payment and store tests**

Run: `pytest tests/test_course_payments.py tests/test_course_store_api.py -q`
Expected: both payment lifecycle and existing store API tests pass.

### Task 3: Idempotent sample course seed command

**Files:**
- Create: `scripts/__init__.py`
- Create: `scripts/seed_courses.py`
- Test: `tests/test_course_seed.py`

**Interfaces:**
- Produce `seed_courses(db: Session, instructor_id: int) -> int`; insert exactly five published sample courses only when the catalog is empty and return the inserted count, otherwise return 0 without modifying existing rows.
- CLI: `python -m scripts.seed_courses --instructor-id <existing-user-id>` using the configured `DATABASE_URL`; reject an unknown instructor without changing the database.
- Use Korean titles, descriptions, categories, and curriculum; use the selected account's name as `instructor_name` and its ID as `created_by`.
- Seed these titles: `FastAPI로 만드는 실전 백엔드`, `Vue 3 서비스 개발`, `SQL로 배우는 데이터 분석`, `Python 자동화 기초`, and `Git과 배포 첫걸음`.

- [x] **Step 1: Write seed command tests**

Assert five records are inserted with the selected existing instructor; a second run inserts zero; an already-populated catalog remains byte-for-byte unchanged; and an unknown instructor fails without partial inserts.

- [x] **Step 2: Run seed tests and confirm they fail because the command is missing**

Run: `pytest tests/test_course_seed.py -q`
Expected: FAIL because `seed_courses` is not implemented.

- [x] **Step 3: Implement the seed function and CLI**

Commit all five records in one transaction and roll back on validation errors.

- [x] **Step 4: Run seed tests and populate the current empty local catalog**

Run: `pytest tests/test_course_seed.py -q`, then `python -m scripts.seed_courses --instructor-id 1`.
Expected: tests pass and the local catalog reports five inserted courses; a repeated command reports zero inserted.

### Task 4: PortOne browser checkout and completion experience

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/src/lib/portone.js`
- Create: `frontend/src/views/PaymentCompleteView.vue`
- Modify: `frontend/src/views/CourseDetailView.vue`
- Modify: `frontend/src/views/OrderListView.vue`
- Modify: `frontend/src/router.js`
- Test: `frontend/test/portone.spec.js`
- Test: `frontend/test/CourseDetailView.spec.js`
- Test: `frontend/test/PaymentCompleteView.spec.js`
- Test: `frontend/test/OrderListView.spec.js`

**Interfaces:**
- `frontend/src/lib/portone.js` exports `requestCoursePayment({ paymentId, orderName, totalAmount, orderId })`; call PortOne V2 `requestPayment` with `VITE_PORTONE_STORE_ID`, `VITE_PORTONE_CHANNEL_KEY`, `currency: 'KRW'`, `payMethod: 'CARD'`, `redirectUrl` pointing to `/payments/complete?orderId=<orderId>`, and `forceRedirect: true`.
- Detail view checks public Store ID and channel key before creating an order. Then it posts only `{ course_id }` to `/order/register`; a free paid order skips the SDK; a paid-price order launches checkout using returned values only.
- Completion route reads `orderId`, `paymentId`, `code`, and `message` from redirect query parameters. On provider error, show a safe failure and do not call completion; otherwise post `{ order_id, payment_id }` to `/order/complete` and show verified success only after API success.
- Order history shows pending versus paid status and formats optional `paid_at`; keep 401 redirects to login.
- `../../../frontend/.env.local` documents empty `VITE_PORTONE_STORE_ID` and `VITE_PORTONE_CHANNEL_KEY`; root `.env.local` documents the empty backend secret.

- [x] **Step 1: Write failing SDK, detail, redirect completion, and history tests**

Mock the SDK and API. Assert exact checkout arguments and `CARD`/`KRW`; missing config prevents order creation; free courses skip SDK; SDK/redirect failures do not claim success; valid redirect calls the backend completion API; only verified API success shows paid; and history distinguishes paid and pending orders.

- [x] **Step 2: Run focused Jest tests and confirm missing checkout behavior**

Run: `npm test -- --runTestsByPath test/portone.spec.js test/CourseDetailView.spec.js test/PaymentCompleteView.spec.js test/OrderListView.spec.js`
Expected: FAIL for the missing SDK adapter and completion view.

- [x] **Step 3: Add the official SDK and implement the checkout flow**

Install the official `@portone/browser-sdk` V2 dependency, isolate it behind the tested adapter, add the completion route, and update paid/pending history rendering.

- [x] **Step 4: Run focused Jest tests**

Run: `npm test -- --runTestsByPath test/portone.spec.js test/CourseDetailView.spec.js test/PaymentCompleteView.spec.js test/OrderListView.spec.js`
Expected: all focused payment UI tests pass.

### Task 5: Full verification and live-configuration check

**Files:**
- Modify: `docs/superpowers/specs/2026-10-20-portone-course-payments-design.md` only if implementation reveals an agreed-contract correction.

- [x] **Step 1: Run the complete backend suite**

Run: `pytest -q`
Expected: all backend tests pass.

- [x] **Step 2: Run the complete frontend suite and production build**

Run from `frontend`: `npm test` and `npm run build`.
Expected: all Jest tests pass and Vite build succeeds.

- [x] **Step 3: Review local configuration and payment evidence**

Confirm real secrets are absent from tracked files, report whether Store ID/channel key/API secret are configured, and distinguish mock API evidence from any live PortOne checkout. Do not run a real charge during automated verification.

## Self-Review

- **Spec coverage:** API creation/verification, paid history, SQLite migration, sample-course seed, frontend checkout/redirect, credentials, errors, free orders, and automated tests map to Tasks 1–5.
- **Step scan:** each checkbox is one test, implementation unit, or verification action with an explicit command and expected result.
- **Type consistency:** `payment_id`, `order_id`, `paid_at`, `get_payment`, `get_portone_client`, and `seed_courses` names are consistent across tasks.
- **Review Focus:** ownership, upstream status/currency/amount, idempotency, configuration/upstream failure, and preserving existing SQLite/catalog data each have an owning test in Tasks 1–3.
- **Proportion:** five tasks separate persistence/provider access, API lifecycle, data seed, UI flow, and final verification while retaining one shared payment contract.
