# Kakao login continuation notes

Read this before continuing Kakao login work in this repository.

## User preferences and setup

- Keep the implementation in an isolated Git worktree. Current worktree: `C:\Users\Playdata\AppData\Local\Temp\backend_py2-kakao-js-login`, branch `codex/kakao-js-login`.
- The user will start the frontend and backend servers. Do not start them unless asked. No project servers were listening on ports 4900, 5173, or 8000 at the last check; the Postman simulation was stopped.
- The frontend should proxy `/api` to `http://127.0.0.1:8000`. This is already configured in `frontend/vite.config.js` in the feature worktree.
- User approved Chrome DevTools for Kakao Developers app 1614700 setup, but pause further console changes after the user interrupted the previous settings action unless they direct otherwise.

## Implemented in the worktree

- Kakao JavaScript SDK v2 authorization-code login requests only `profile_nickname`; no email is requested or used. Kakao accounts are identified by Kakao's app-scoped ID, so an email collision cannot be checked because Kakao email is unavailable.
- Backend provider adapter exchanges the code and reads only Kakao ID and nickname. OAuth state validation, nickname-only accounts, repeat login, and local email/password compatibility are implemented.
- SQLite migration preserves local accounts and allows Kakao-only accounts.
- Last verification: backend pytest 15 passed; frontend Jest 10 passed; Vite production build succeeded. No live Kakao round trip has been done.
- `.env.local` has placeholders only. No local Kakao keys have been configured in the isolated worktree.

## Kakao Developers console status

- Kakao Login for app 1614700 was turned ON in Chrome DevTools.
- `profile_nickname` remains “사용 안 함”; the email item showed “권한 없음”. The nickname consent dialog was open when the browser action was cancelled; it was not saved.
- Remaining console setup: set nickname consent only, register web origin `http://localhost:5173`, register callback `http://localhost:5173/api/user/kakao/callback`, then configure local JS and REST keys without committing them. Keep email unrequested.
- After that, the user runs both servers and can perform a real login test with their Kakao account.

