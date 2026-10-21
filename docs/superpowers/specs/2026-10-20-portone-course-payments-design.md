# PortOne Course Payments Design

## Goal and scope

Extend the existing Vue and FastAPI course store so a signed-in customer can pay for a course from its detail page. Use PortOne V2 with the Toss Payments new module, verify payment on the server, and add five sample courses to the empty local catalog. Keep the existing course registration, board, login, and order history behavior.

This release supports one-time Korean won card payments. Refunds, virtual accounts, webhooks, course playback/enrollment, coupons, and payment cancellation are out of scope. A zero-price course is recorded as paid without opening a PG checkout.

## User flow

1. The customer opens a published course and selects **구매하기**.
2. The backend creates an order using the current course title and price, authenticated buyer, and a unique payment ID. It returns the checkout data; the browser never chooses the amount or payment ID.
3. For a positive amount, the browser invokes `@portone/browser-sdk/v2` with the configured Store ID, Toss Payments new-module channel key, KRW, and `CARD`. The configured redirect route supports the SDK's mobile redirect flow.
4. The browser sends the returned payment ID and order ID to the backend. The backend retrieves the payment from PortOne and marks the order paid only when the payment ID matches the order, status is `PAID`, currency is KRW, and the total exactly matches the order snapshot.
5. The customer sees success or a recoverable failure message and can open order history. Repeating completion for an already-paid order is idempotent.

The redirect query is untrusted input. It only identifies which server-owned order to check; it never establishes payment success. The server API secret is never returned to or embedded in the browser.

## API contract

Keep the existing `{ code, message, result }` response envelope and both `/api` and unprefixed route mounts. All order operations require the existing `EN_AT` authentication cookie.

### `POST /order/register`

Request body remains `{ "course_id": positive_integer }`. The server finds a published course and creates an order snapshot. For a positive-price course, return 201 with:

```json
{
  "idx": 42,
  "course_id": 3,
  "course_title": "FastAPI 실전 백엔드",
  "amount": 39000,
  "status": "pending_payment",
  "payment_id": "course-42-<32-hex-characters>"
}
```

For a zero-price course, return an order with `status: "paid"` and no `payment_id`; do not call PortOne.

### `POST /order/complete`

Request body: `{ "order_id": positive_integer, "payment_id": string }`. The server scopes the order to the authenticated buyer, checks its stored payment ID, then queries PortOne `GET /payments/{paymentId}` with the server-only `PORTONE_API_SECRET`. A verified payment returns the updated order with `status: "paid"` and `paid_at`. A mismatch, non-`PAID` state, or non-KRW payment is not marked paid. Unknown orders return 404, another buyer's order returns 404, a payment/order mismatch or a non-paid PortOne state returns 409, missing server configuration returns 503, and an unavailable PortOne API returns 502. Do not expose credentials or raw upstream error bodies.

`GET /order/list` keeps its existing ownership scope and includes the updated status and optional `paid_at`; it never returns the payment ID.

## Persistence and migration

Add nullable, unique `payment_id` and nullable UTC `paid_at` columns to `course_order`. Existing orders remain `pending_payment`; do not infer payment from old client state. Since `create_all` does not add columns to an existing SQLite table, run a narrowly scoped idempotent SQLite migration before serving requests.

Add an idempotent seed command that inserts five published Korean-language sample courses only when the catalog is empty, associates them with an existing account selected by the command, and skips without changes when courses already exist. Run it against the local database after implementation to populate the currently empty catalog. Do not create fake accounts or overwrite existing courses.

## Configuration and security

- Frontend build-time values: `VITE_PORTONE_STORE_ID` and `VITE_PORTONE_CHANNEL_KEY`.
- Backend secret: `PORTONE_API_SECRET`.
- Keep only empty placeholders in `.env.local`; never commit real credentials.
- Use the official PortOne V2 browser SDK package and the Toss Payments new-module channel configured in PortOne Console.
- Derive buyer, course title, amount, order ID, payment ID, and state from server records. Verify upstream payment status, currency, and exact amount before changing order state.
- Protect the completion endpoint with authentication and buyer ownership checks. Treat cancellation and SDK errors as pending orders with a visible retry path.

## Frontend behavior

- Replace the pending-only action on the detail page with **구매하기**, showing loading state and preventing duplicate clicks while an order is created or the checkout is active.
- Add `/payments/complete` to handle both SDK redirect success and failure query parameters, call the authenticated completion API, and show a result with a link to `/orders`.
- On a missing payment configuration, explain that checkout is not configured and do not create a charge.
- Update order history to show pending and paid states, and display `paid_at` when present.
- Keep login redirection for signed-out customers and preserve the course detail return path.

## Verification

- Backend pytest: order creation uses server-owned amount and payment ID; free orders skip payment; completion verifies owner, payment ID, `PAID` status, KRW, exact amount, provider/configuration failures, and idempotent retry; migration is idempotent; seed is repeatable and does not overwrite an existing catalog.
- Frontend Jest: checkout receives only server-created checkout values; success and error SDK results; redirect completion; missing configuration; signed-out redirect; paid and pending history states.
- Run the full pytest and Jest suites and the Vite production build. Test PortOne calls with a mock transport; no real charge is made during automated verification.
- Report separately whether a live PortOne checkout was possible. It depends on reachable PortOne Console settings and valid Store ID, channel key, API secret, and an eligible test payment setup.

## External reference

Use PortOne's [V2 authenticated checkout](https://developers.portone.io/opi/ko/integration/start/v2/checkout) and [Toss Payments V2 integration](https://developers.portone.io/opi/ko/integration/pg/v2/tosspayments). The provider documentation requires server-side payment lookup and amount validation; Toss Payments V2 requires the Toss Payments new-module channel and a channel key.
