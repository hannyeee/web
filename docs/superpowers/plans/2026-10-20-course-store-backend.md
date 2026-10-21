# Online Course Store Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated course registration and pending-payment orders, plus a public course catalog, using FastAPI and SQLite.

**Architecture:** Add dedicated Course and CourseOrder tables, Pydantic schemas, and routers. A shared dependency verifies `EN_AT`, loads the account by JWT subject, and supplies server-owned identity and price data to write operations.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, PyJWT, SQLite, pytest.

**Spec:** `docs/superpowers/specs/2026-10-20-online-course-store-design.md`

## Global Constraints

- Keep the existing `{ code, message, result }` response envelope and both `/api` and unprefixed router mounts.
- Keep course images as optional URLs; do not add upload/storage, real payment, enrollment, roles, or destructive database migrations.
- Derive instructor and buyer identity from the validated `EN_AT` JWT cookie; derive order amount and title from the current course row.
- New orders use `pending_payment`; users can read only their own order history.
- Add pytest coverage and run the complete backend suite.

## Review Focus

- Missing, malformed, expired, or unknown-user JWT must return 401 — test each invalid-cookie class in the auth dependency tests.
- Blank required fields, negative/non-integer price, and empty curriculum must return 422 — test schema validation.
- Unpublished or nonexistent course IDs must not leak into public reads or orders — test catalog filtering and order 404.
- Client-provided instructor, buyer, amount, or status must not override server values — test registration and order request bodies with forged fields.
- Orders must retain the creation-time title and amount and remain buyer-scoped — test snapshot behavior and two-user history isolation.

### Task 1: Authenticated identity and course/order persistence

**Files:**
- Create: `app/core/auth.py`
- Create: `app/models/course.py`
- Create: `app/models/course_order.py`
- Create: `app/schemas/course.py`
- Create: `app/schemas/course_order.py`
- Modify: `app/core/security.py`
- Modify: `app/models/__init__.py`
- Test: `tests/test_course_auth.py`

**Interfaces:**
- Produce `get_current_user(request: Request, db: Session = Depends(get_db)) -> User` in `app/core/auth.py`; it verifies the configured JWT and resolves `sub` as the existing user's email.
- Produce `CourseCreateReq`, `CourseRes`, `CourseSummary`, `CourseListRes`, `OrderCreateReq`, `OrderRes`, and `OrderListRes` matching the spec contract.
- Course schema fields: `title`, `description`, `instructor_name`, `category`, `price`, `image_url`, `curriculum`, `created_by`; request excludes server-owned fields.
- Order schema fields: `idx`, `course_id`, `course_title`, `amount`, `status`, `created_at`; request accepts `course_id` only.

- [ ] **Step 1: Write auth and validation tests**

Test successful cookie resolution, absent/malformed/expired token rejection, unknown email rejection, and Pydantic constraints for course and order inputs.

- [ ] **Step 2: Run the focused tests and confirm they fail for missing implementations**

Run: `pytest tests/test_course_auth.py -q`
Expected: FAIL because the dependency and schemas do not exist.

- [ ] **Step 3: Implement the dependency, models, and schemas**

Verify JWT using `settings.SECRET_KEY` and `settings.ALGORITHM`, require `sub`, and return HTTP 401 for any decode or lookup failure. Remove the signing-key `print` from `createToken`. Define foreign keys to existing `user.idx` and `course.idx`; set order timestamps in UTC and the status default to `pending_payment`.

- [ ] **Step 4: Register model imports and run focused tests**

Run: `pytest tests/test_course_auth.py -q`
Expected: PASS.

### Task 2: Course catalog and order API

**Files:**
- Create: `app/api/routers/course.py`
- Create: `app/api/routers/order.py`
- Modify: `app/main.py`
- Test: `tests/test_course_store_api.py`

**Interfaces:**
- Consume `get_current_user`, the schemas and ORM models from Task 1, and existing `get_db` and `ApiResponse`.
- Produce `GET /course/list`, `GET /course/read/{idx}`, `POST /course/register`, `POST /order/register`, and `GET /order/list` at `/api` and unprefixed paths.

- [ ] **Step 1: Write endpoint tests**

Cover public catalog ordering and unpublished filtering; public detail; authenticated registration with instructor derived from the account; 401 without cookie; order creation snapshotting course title/price and setting `pending_payment`; 404 for missing/unpublished course; and history isolation between two users. Include forged `instructor_name`, `created_by`, `buyer_id`, `amount`, and `status` inputs and assert they are ignored or rejected.

- [ ] **Step 2: Run focused tests and confirm they fail**

Run: `pytest tests/test_course_store_api.py -q`
Expected: FAIL because the course/order routers are not registered.

- [ ] **Step 3: Implement routes and create tables through existing metadata startup**

Use one database transaction per write. The list endpoint returns published courses newest first; order list filters by the authenticated buyer. Mount both routers with `/api` and without a prefix, preserving existing routers.

- [ ] **Step 4: Run endpoint and full backend tests**

Run: `pytest tests/test_course_auth.py tests/test_course_store_api.py -q`, then `pytest -q`.
Expected: all tests pass.

## Self-Review

- Spec coverage: catalog, detail, registration, pending-payment order creation, ownership, response envelope, authentication, SQLite table creation, and all requested failure states map to Tasks 1 and 2.
- Step scan: each checkbox asks for one test, implementation unit, or verification action.
- Type consistency: router request/response types match the schema names produced by Task 1.
- Review focus: each listed condition is covered in the task owning its code.
- Proportion: two tasks cover the backend dependency, persistence, and HTTP contract without prescribing routine implementation details.
