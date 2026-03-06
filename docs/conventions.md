# Coding Conventions

> These rules apply to ALL agents. Read before writing any code.

## Python (Backend — `/api/`)

### Style
- Python 3.12+ features allowed (type unions `X | Y`, match statements)
- Use `ruff` for linting and formatting (config in `pyproject.toml`)
- Max line length: 100 characters
- All functions and methods must have type hints — no exceptions
- Use `from __future__ import annotations` at top of every file

### Naming
```python
# Files and directories: snake_case
auth_router.py
token_service.py

# Classes: PascalCase
class UserProgressService:

# Functions, methods, variables: snake_case
def calculate_xp_for_lesson():
    total_xp = base_xp + bonus_xp

# Constants: UPPER_SNAKE_CASE
MAX_STREAK_BONUS_XP = 50
DEFAULT_SRS_EASE_FACTOR = 2.5

# Pydantic models (request/response): PascalCase, suffixed
class LessonCompleteRequest(BaseModel):
class LessonCompleteResponse(BaseModel):
class UserProgressOut(BaseModel):    # "Out" suffix for read models
class UserCreate(BaseModel):         # "Create" suffix for creation
class UserUpdate(BaseModel):         # "Update" suffix for partial update
```

### FastAPI Patterns
```python
# Router file structure — every module follows this pattern:
# src/{module}/router.py    ← API endpoints
# src/{module}/service.py   ← Business logic (no HTTP awareness)
# src/{module}/models.py    ← SQLAlchemy ORM models
# src/{module}/schemas.py   ← Pydantic request/response schemas
# src/{module}/deps.py      ← Module-specific dependencies (optional)

# Router example:
from fastapi import APIRouter, Depends, HTTPException, status
from src.core.deps import get_current_user, get_db
from src.auth.schemas import TokenResponse, LoginRequest
from src.auth.service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    service = AuthService(db)
    return await service.login(request.email, request.password)
```

### Database Patterns
```python
# All models inherit from Base with common fields
class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

# Model example:
class User(Base, TimestampMixin):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)

# Always use async sessions:
from sqlalchemy.ext.asyncio import AsyncSession

# Always use Alembic for migrations — never raw SQL:
# alembic revision --autogenerate -m "add_streak_freeze_column"
# alembic upgrade head
```

### Error Handling
```python
# Use HTTPException with specific status codes, never bare 500s
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Lesson not found",
)

# For business logic errors, define custom exceptions in src/core/exceptions.py
class InsufficientXPError(AppException):
    status_code = 400
    detail = "Insufficient XP for this action"

# Never catch bare `except Exception` — always catch specific types
```

### Testing
```python
# Test file mirrors source file: src/auth/service.py → tests/test_auth/test_service.py
# Use pytest + pytest-asyncio + httpx
# Every service method needs at least one happy path + one error path test

import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    response = await client.post("/api/v1/auth/login", json={
        "email": test_user.email,
        "password": "testpass123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

## TypeScript (Mobile & Web)

### Style
- Strict TypeScript — no `any` types (use `unknown` if truly unknown)
- Use ESLint + Prettier (config in each project root)
- Functional components only — no class components
- Named exports for components, default export only for screen/page files

### Naming
```typescript
// Files: PascalCase for components, camelCase for utilities/hooks/services
LessonPlayer.tsx
useProgress.ts
apiClient.ts

// Components: PascalCase
export function LessonPlayer({ lessonId }: LessonPlayerProps) {}

// Hooks: camelCase with "use" prefix
export function useLeaderboard(period: "weekly" | "monthly") {}

// Types/Interfaces: PascalCase, prefer `interface` for objects, `type` for unions
interface LessonData {
  id: string;
  exercises: Exercise[];
}
type ExerciseType = "multiple_choice" | "fill_blank" | "matching" | "listening";

// Constants: UPPER_SNAKE_CASE
export const MAX_HEARTS = 5;
export const XP_PER_LESSON = 10;
```

### React Patterns
```typescript
// Component file structure:
// 1. Imports
// 2. Types/Interfaces
// 3. Component function
// 4. Styles (if using StyleSheet in RN)

// State management: Zustand for global state, React Query for server state
// Local state: useState for simple, useReducer for complex

// API calls: ALWAYS through the generated API client in /shared/api-client/
// Never write raw fetch() calls to our API
import { api } from "@/services/api";
const { data: lessons } = useQuery({
  queryKey: ["lessons", courseId],
  queryFn: () => api.lessons.getForCourse(courseId),
});

// Shared types come from /shared/types/ — never redefine API types locally
import type { LessonResponse, ExerciseType } from "@lingualeap/types";
```

### Mobile-Specific (React Native)
```typescript
// Use Expo modules, not bare React Native modules:
// ✅ expo-av (audio), expo-notifications, expo-sqlite, expo-secure-store
// ❌ react-native-sound, @react-native-community/push-notification-ios

// Navigation: Expo Router file-based routing
// app/(auth)/login.tsx      → /login
// app/(tabs)/home.tsx       → /home (tab navigator)
// app/(lesson)/[id].tsx     → /lesson/123 (modal stack)

// Animations: React Native Reanimated for performance
// Simple transitions: LayoutAnimation (built-in)
```

### Web-Specific (Next.js)
```typescript
// Use App Router (not Pages Router)
// Server Components by default — add "use client" only when needed
// Marketing pages: Server Components (SSR, SEO)
// App experience (lesson player, dashboard): Client Components

// Auth: HTTP-only cookies managed through Next.js API routes
// Never expose tokens to client-side JavaScript on web
```

## Git Conventions

```bash
# Branch naming
feat/auth-jwt-refresh
fix/streak-timezone-bug
chore/update-dependencies

# Commit messages (Conventional Commits)
feat(auth): add Google OAuth2 login flow
fix(progress): handle duplicate lesson completion
test(srs): add SM-2 algorithm edge case tests
docs(api): update endpoint documentation
chore(deps): bump fastapi to 0.115.0

# Every PR must:
# 1. Pass all existing tests
# 2. Include tests for new functionality
# 3. Include CHANGELOG_ENTRY if API/schema changed
# 4. Not modify files outside the agent's assigned directory
```

## Environment Variables

```bash
# All config goes through environment variables
# Local: .env file (git-ignored)
# Production: Railway/Vercel env settings
# Never hardcode secrets, URLs, or feature flags

# Naming: PREFIX_DESCRIPTIVE_NAME
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
S3_BUCKET_NAME=lingualeap-content
S3_REGION=us-east-1
JWT_SECRET_KEY=...
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30
REVENUECAT_API_KEY=...
REVENUECAT_WEBHOOK_SECRET=...
FCM_SERVER_KEY=...
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
APPLE_OAUTH_CLIENT_ID=...
```
