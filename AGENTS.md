# 기술 스택
frontend 폴더의 vue 프로젝트로 프론트엔드 개발
app 폴더에 fastapi 프로젝트로 백엔드 개발
DB는 SQLlite로 app.db 파일로 관리

# 검증
백엔드는 pytest로 테스트할 수 있는 테스트 코드 작성 후 전체 통과되면 완료
프론트엔드는 jest로 테스트할 수 있는 테스트 코드 작성 후 전체 통과되면 완료
## Session continuation
Read `.agents/kakao-login-progress.md` before continuing Kakao login work.

## Persistent specialist agents
Subagent instances may be session-scoped. At the start of every new session, create the relevant specialist again using the repository role template below; pass its `developer_instructions` explicitly.
For backend work, read `.codex/agents/backend-dev.toml` and create a `backend_dev` subagent with its `developer_instructions`.
For frontend work, read `.codex/agents/frontend-dev.toml` and create a `frontend_dev` subagent with its `developer_instructions`.
When a task spans both areas and can be split safely, create both specialists and give each a focused, independent scope. Keep the coordinating agent responsible for integration and the final report.
These files are repository role templates. Pass their instructions explicitly when spawning; do not assume the runtime auto-loads repository-local role files.
