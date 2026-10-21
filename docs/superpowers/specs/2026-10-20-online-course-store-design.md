# Online Course Store Design

## Goal and scope

Turn the existing Vue and FastAPI application into a small online course store where a signed-in user can register a course and a signed-in customer can create a purchase order. This first version does not process payments or grant course access. Orders remain `pending_payment` so a payment provider can be added later.

The existing board remains available at `/board`; the store becomes the home page. Product image handling uses an optional URL. Upload/storage, instructor roles, product editing/deletion, course playback, coupons, refunds, and real payments are out of scope.

## User flows

1. A visitor opens the course catalog and browses published courses.
2. A visitor opens a course detail page and sees its title, description, instructor, category, price, image, and curriculum.
3. A signed-in user registers a course. The course is published immediately and appears in the catalog.
4. A signed-in customer creates an order from a course detail page. The server records the current price snapshot and `pending_payment` status; the UI explains that payment is not available yet and links to the order list.
5. A signed-in customer views only their own order history.

Any existing account may register courses and place orders; this release does not define separate instructor or administrator roles. Authentication uses the existing `EN_AT` cookie and JWT email identity. API routes that create courses or orders, and routes that list orders, must reject missing or invalid cookies with HTTP 401.

## Data model

### Course

- `idx`: integer primary key.
- `title`: required string, 1–160 characters.
- `description`: required text, non-blank.
- `instructor_name`: required string, 1–100 characters; initialized from the signed-in user's name.
- `category`: required string, 1–60 characters.
- `price`: required non-negative integer in KRW.
- `image_url`: optional URL string.
- `curriculum`: required text containing one lesson title per line; at least one non-blank line.
- `created_by`: foreign key to the registering user.
- `is_published`: boolean, true on registration.

### CourseOrder

- `idx`: integer primary key.
- `buyer_id`: foreign key to the signed-in user.
- `course_id`: foreign key to the course.
- `course_title`: title snapshot at order creation.
- `amount`: integer KRW snapshot at order creation.
- `status`: string enum; this release creates `pending_payment` only.
- `created_at`: UTC timestamp.

Use separate tables; do not alter or repurpose board records. Existing SQLite databases are initialized with `Base.metadata.create_all`, so adding tables requires no destructive migration.

## API contract

All success responses keep the existing `{ code, message, result }` envelope. Existing route mounting supports both `/api/...` and the path without `/api`.

### Courses

- `GET /course/list`: public. Returns `{ items: CourseSummary[], total: number }`; only published courses, newest first.
- `GET /course/read/{idx}`: public. Returns one published course; unknown or unpublished IDs return 404.
- `POST /course/register`: requires `EN_AT`. Body: `{ title, description, category, price, image_url?, curriculum }`. Returns 201 and the created course, including `instructor_name` from the authenticated account.

Course representation: `{ idx, title, description, instructor_name, category, price, image_url, curriculum, created_by }`. List summaries may omit `curriculum` and `created_by`.

### Orders

- `POST /order/register`: requires `EN_AT`. Body: `{ course_id }`. Returns 201 and `{ idx, course_id, course_title, amount, status, created_at }`, with `status: "pending_payment"`. A missing/unpublished course returns 404.
- `GET /order/list`: requires `EN_AT`. Returns `{ items: Order[], total: number }` for the authenticated buyer only, newest first.

Authentication failures return 401 in the project's standard error envelope. Request validation failures return 422. No endpoint accepts a client-supplied buyer ID, instructor name, amount, or order status.

## Frontend experience

- Replace the `/` redirect with the course catalog at `/courses`; keep `/board` routes and board pages working.
- Add `/courses/new`, `/courses/:idx`, and `/orders` routes.
- Update the shared navigation and footer to identify the store and retain a link to the board.
- Use a restrained premium storefront style: a spacious editorial hero, clear typography, neutral surfaces, and responsive course cards with category, title, instructor, and KRW price. Do not use Apple marks or imply affiliation.
- Catalog includes loading, error, empty, and retry states.
- Detail page shows the full course information and a purchase action. Signed-out users are sent to `/login` with a return destination; signed-in users create the pending-payment order.
- Course registration form validates required fields and non-negative integer price, submits through the API, and explains that the course is published immediately.
- Order page lists the signed-in user's pending-payment records and clearly states that payment must be added later.
- API calls use Axios with the existing `/api` backend path and send cookies (`withCredentials: true`) for authenticated requests.

## Verification

- Backend: pytest coverage for public catalog ordering/visibility, course registration validation and authentication, order price snapshots, 404 behavior, and buyer-scoped order history.
- Frontend: Jest coverage for catalog rendering and states, form validation/submission, course detail order creation, auth redirect, and order history.
- Run the complete backend and frontend test suites as required by `AGENTS.md`.

## Implementation split

- Backend specialist owns `app/models/course.py`, `app/models/course_order.py`, the matching schema and router modules, auth dependency integration, app router/model registration, and backend pytest files.
- Frontend specialist owns `frontend/src` course views/components, routing, navigation/style changes, and Jest files.
- The API contract above is the coordination boundary. Keep existing board behavior and unrelated working-tree edits intact.

## Known implementation constraint

The current login route sets the `EN_AT` JWT cookie and the token payload identifies accounts by email. The backend must validate this cookie using the configured JWT algorithm/secret and load the matching user for protected course/order operations. Do not trust identity, amount, or ownership values supplied by the browser.

The existing token creation helper prints the configured secret key to stdout. Remove that print while adding the shared authentication dependency so login and course/order operations do not expose the signing secret in logs.
