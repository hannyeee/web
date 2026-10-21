# Online Course Store Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive online course storefront with course registration, pending-payment order creation, and customer order history.

**Architecture:** Keep the Vue 3 and Vue Router structure and adapt the existing `api()` helper to Axios. Add course and order views around the backend contract in the spec, update the shared storefront shell, and preserve all `/board` routes and behavior.

**Tech Stack:** Vue 3, Vue Router 4, Axios, Jest, Vue Test Utils, Vite.

**Spec:** `docs/superpowers/specs/2026-10-20-online-course-store-design.md`

## Global Constraints

- Store pages use the backend contract in the spec and the existing `{ code, message, result }` API envelope.
- Use Axios for backend calls, with `/api` as the base URL and `withCredentials: true` for authenticated requests.
- Do not trust browser-supplied amount or identity values.
- Keep the existing `/board` pages and their behavior available.
- Do not add real payment, course playback, image upload, or instructor-role UI.
- Add Jest coverage and run the complete frontend suite.

## Review Focus

- A failed or empty catalog request must show the correct state and allow retry — test loading, error, and empty catalog states.
- Missing optional course images and long titles/curricula must not break layout — test rendering fallbacks and narrow viewport classes.
- Non-integer, negative, or blank course form values must not submit — test each validation boundary.
- A signed-out purchase must route to login and preserve the intended return path — test router behavior.
- A failed order creation must keep the detail page usable and show an error; success must display pending-payment guidance — test both outcomes.

### Task 1: Shared API behavior, routes, and storefront navigation

**Files:**
- Modify: `frontend/src/lib/api.js`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/src/router.js`
- Modify: `frontend/src/App.vue`
- Modify: `frontend/src/style.css`
- Test: `frontend/test/App.spec.js`
- Test: `frontend/test/api.spec.js`

**Interfaces:**
- Produce routes `/courses`, `/courses/new`, `/courses/:idx(\\d+)`, and `/orders`; `/` opens `/courses`, and existing `/board` routes remain.
- Keep `api(path, options)` and implement it with Axios; use `/api` as the base URL and `withCredentials: true`, unwrap the existing `result` envelope, and surface the backend `message` on HTTP errors.
- Store pages use shared shell navigation links to Courses, Register Course, Orders, and Board; the current route is marked accessibly.

- [ ] **Step 1: Write API and shell tests**

Assert Axios requests include cookies, preserve request options, unwrap successful results, and expose backend error messages; assert `/` opens the course view, store navigation links exist, and board navigation still renders.

- [ ] **Step 2: Run focused tests and confirm failures**

Run: `npm test -- --runTestsByPath test/api.spec.js test/App.spec.js`
Expected: FAIL for missing Axios credential setup and store routes/navigation.

- [ ] **Step 3: Implement API helper, routes, and shared shell**

Add Axios if absent from the project dependencies. Set `/` to `/courses`; leave board route definitions unchanged. Use a clean premium storefront style with responsive layout and no Apple marks or brand implication.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- --runTestsByPath test/api.spec.js test/App.spec.js`
Expected: PASS.

### Task 2: Course catalog and details

**Files:**
- Create: `frontend/src/views/CourseListView.vue`
- Create: `frontend/src/views/CourseDetailView.vue`
- Create: `frontend/src/components/CourseCard.vue`
- Test: `frontend/test/CourseListView.spec.js`
- Test: `frontend/test/CourseDetailView.spec.js`

**Interfaces:**
- Consume `GET /course/list` result `{ items, total }` and `GET /course/read/{idx}` result course fields from the spec.
- Detail purchase action calls `POST /order/register` with `{ course_id }` only and uses `GET /order/list` route after success.

- [ ] **Step 1: Write catalog and detail view tests**

Assert course cards show category, title, instructor, and localized KRW price; loading/error/empty/retry states render; missing image uses fallback; detail displays curriculum; signed-in purchase sends only the course ID; success shows payment-pending guidance; request failure shows an alert.

- [ ] **Step 2: Run focused tests and confirm failures**

Run: `npm test -- --runTestsByPath test/CourseListView.spec.js test/CourseDetailView.spec.js`
Expected: FAIL because views and card do not exist.

- [ ] **Step 3: Implement catalog and detail views**

Use responsive semantic cards, safe fallbacks for absent image URLs, and explicit loading/error/empty states. Format prices with `Intl.NumberFormat('ko-KR')` and `원`.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- --runTestsByPath test/CourseListView.spec.js test/CourseDetailView.spec.js`
Expected: PASS.

### Task 3: Course registration and order history

**Files:**
- Create: `frontend/src/views/CourseCreateView.vue`
- Create: `frontend/src/views/OrderListView.vue`
- Test: `frontend/test/CourseCreateView.spec.js`
- Test: `frontend/test/OrderListView.spec.js`

**Interfaces:**
- Course registration submits `{ title, description, category, price, image_url?, curriculum }` to `POST /course/register`.
- Order history consumes `{ items, total }` from `GET /order/list` and displays `course_title`, `amount`, `status`, and `created_at`.

- [ ] **Step 1: Write form and order-history tests**

Assert required fields and a non-negative integer price validation; valid submission redirects to `/courses/{idx}`; 401 redirects to login with a return destination; API errors render an alert; order list shows pending-payment status and a clear no-payment-yet explanation.

- [ ] **Step 2: Run focused tests and confirm failures**

Run: `npm test -- --runTestsByPath test/CourseCreateView.spec.js test/OrderListView.spec.js`
Expected: FAIL because views do not exist.

- [ ] **Step 3: Implement registration and order history views**

Publish immediately on successful registration and preserve user input on failure. In order history, communicate that payment must be added later and never imply course access is active.

- [ ] **Step 4: Run focused and full frontend tests**

Run: `npm test -- --runTestsByPath test/CourseCreateView.spec.js test/OrderListView.spec.js`, then `npm test`.
Expected: all tests pass.

## Self-Review

- Spec coverage: all new routes, catalog states, purchase flow, registration, order history, navigation, cookie credentials, and board preservation map to Tasks 1-3.
- Step scan: each checkbox represents one test, implementation, or verification action.
- Type consistency: frontend payload and response fields match the backend contract in the spec.
- Review focus: each input/failure condition is tested in the view or helper task that owns it.
- Proportion: three tasks provide independently testable shared shell, browsing, and seller/order flows.
