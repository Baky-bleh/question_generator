# Database Schema

> Last synced: 2026-03-06 by doc-sync agent
> Engine: PostgreSQL 16 (hosted on Supabase)
> ORM: SQLAlchemy 2.0 (async) + Alembic migrations

## Schema Rules
- All tables using `TimestampMixin` include `id` (UUID v4 PK), `created_at` (server_default=now()), `updated_at` (server_default=now(), onupdate=now())
- `XPEvent` and `Achievement` define their own `id` and `created_at`/`unlocked_at` without `TimestampMixin`
- All foreign keys have indexes
- Use snake_case for table and column names

---

## Tables

### users
Core user identity. Source: `src/auth/models.py`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK, default uuid4 | Via TimestampMixin |
| email | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | |
| password_hash | VARCHAR(255) | NULLABLE | Null for OAuth-only users |
| display_name | VARCHAR(100) | NOT NULL | |
| avatar_url | VARCHAR(500) | NULLABLE | |
| timezone | VARCHAR(50) | NOT NULL, server_default 'UTC' | IANA timezone string |
| preferred_language | VARCHAR(10) | NOT NULL, server_default 'en' | UI language |
| daily_goal | INTEGER | NOT NULL, server_default 10 | Daily lesson goal (minutes) |
| created_at | TIMESTAMP | NOT NULL, server_default now() | Via TimestampMixin |
| updated_at | TIMESTAMP | NOT NULL, server_default now(), onupdate now() | Via TimestampMixin |

Relationships: `auth_providers` (one-to-many), `refresh_tokens` (one-to-many)

### user_auth_providers
OAuth social login links. Source: `src/auth/models.py`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK | Via TimestampMixin |
| user_id | UUID | FK -> users, INDEX, NOT NULL | |
| provider | VARCHAR(20) | NOT NULL | 'google', 'apple' |
| provider_user_id | VARCHAR(255) | NOT NULL | External ID |
| created_at | TIMESTAMP | NOT NULL | Via TimestampMixin |
| updated_at | TIMESTAMP | NOT NULL | Via TimestampMixin |

Unique constraint: `(provider, provider_user_id)` — name `uq_provider_user`

### refresh_tokens
Active refresh tokens for revocation support. Source: `src/auth/models.py`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK | Via TimestampMixin |
| user_id | UUID | FK -> users, INDEX, NOT NULL | |
| token_hash | VARCHAR(255) | UNIQUE, NOT NULL | SHA-256 of token |
| expires_at | TIMESTAMP | NOT NULL | |
| revoked_at | TIMESTAMP | NULLABLE | Set on logout or rotation |
| device_info | VARCHAR(500) | NULLABLE | User agent string |
| created_at | TIMESTAMP | NOT NULL | Via TimestampMixin |
| updated_at | TIMESTAMP | NOT NULL | Via TimestampMixin |

### courses
Course metadata (content lives on S3/local filesystem). Source: `src/courses/models.py`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK | Via TimestampMixin |
| language_from | VARCHAR(10) | NOT NULL | ISO 639-1 |
| language_to | VARCHAR(10) | NOT NULL | ISO 639-1 |
| title | VARCHAR(255) | NOT NULL | |
| description | TEXT | NULLABLE | |
| thumbnail_url | VARCHAR(500) | NULLABLE | |
| content_version | VARCHAR(50) | NOT NULL | Semver, maps to content path |
| total_units | INT | NOT NULL | |
| total_lessons | INT | NOT NULL | |
| is_published | BOOLEAN | NOT NULL, server_default false | |
| created_at | TIMESTAMP | NOT NULL | Via TimestampMixin |
| updated_at | TIMESTAMP | NOT NULL | Via TimestampMixin |

Unique constraint: `(language_from, language_to)` — name `uq_course_language_pair`

### subscriptions
Unified subscription state across all platforms. Source: `src/subscriptions/models.py`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK | Via TimestampMixin |
| user_id | UUID | FK -> users, UNIQUE, NOT NULL | One active sub per user |
| status | VARCHAR(20) | NOT NULL | 'trial', 'free', 'active', 'cancelled', 'expired', 'billing_issue' |
| platform | VARCHAR(20) | NULLABLE | 'ios', 'android', 'web' |
| product_id | VARCHAR(100) | NULLABLE | Store product identifier |
| revenuecat_id | VARCHAR(255) | NULLABLE, INDEX | RevenueCat customer ID |
| free_trial_expires_at | TIMESTAMP | NOT NULL | |
| current_period_starts_at | TIMESTAMP | NULLABLE | |
| current_period_ends_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | NOT NULL | Via TimestampMixin |
| updated_at | TIMESTAMP | NOT NULL | Via TimestampMixin |

**Note**: Model exists but no router/service yet. Will be built in Phase 4 (Monetization).

### user_course_enrollments
Tracks which courses a user is taking. Source: `src/progress/models.py`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK | Via TimestampMixin |
| user_id | UUID | FK -> users, INDEX, NOT NULL | |
| course_id | UUID | FK -> courses, INDEX, NOT NULL | |
| current_unit_order | INT | NOT NULL, server_default 1 | |
| current_lesson_order | INT | NOT NULL, server_default 1 | |
| enrolled_at | TIMESTAMP | NOT NULL | |
| created_at | TIMESTAMP | NOT NULL | Via TimestampMixin |
| updated_at | TIMESTAMP | NOT NULL | Via TimestampMixin |

Unique constraint: `(user_id, course_id)` — name `uq_user_course`

### lesson_completions
Per-lesson result record. One row per attempt. Source: `src/progress/models.py`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK | Via TimestampMixin |
| user_id | UUID | FK -> users, INDEX, NOT NULL | |
| course_id | UUID | FK -> courses, NOT NULL | For quick filtering |
| lesson_id | VARCHAR(100) | NOT NULL, INDEX | From content JSON |
| unit_order | INT | NOT NULL | |
| lesson_order | INT | NOT NULL | |
| score | INT | NOT NULL | 0-100 |
| xp_earned | INT | NOT NULL | |
| time_seconds | INT | NOT NULL | |
| mistakes | INT | NOT NULL | |
| is_perfect | BOOLEAN | NOT NULL | |
| completed_at | TIMESTAMP | NOT NULL | |
| created_at | TIMESTAMP | NOT NULL | Via TimestampMixin |
| updated_at | TIMESTAMP | NOT NULL | Via TimestampMixin |

Composite index: `(user_id, lesson_id)` — name `ix_lesson_completions_user_lesson`

### srs_items
Spaced repetition state per user per concept (SM-2 algorithm). Source: `src/srs/models.py`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK | Via TimestampMixin |
| user_id | UUID | FK -> users, INDEX, NOT NULL | |
| course_id | UUID | FK -> courses, NOT NULL | |
| concept_id | VARCHAR(100) | NOT NULL | From content JSON |
| concept_type | VARCHAR(20) | NOT NULL | 'vocabulary', 'grammar' |
| ease_factor | FLOAT | NOT NULL, server_default 2.5 | SM-2 EF |
| interval_days | INT | NOT NULL, server_default 1 | Current interval |
| repetition_count | INT | NOT NULL, server_default 0 | |
| next_review_at | TIMESTAMP | NOT NULL, INDEX | |
| last_reviewed_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | NOT NULL | Via TimestampMixin |
| updated_at | TIMESTAMP | NOT NULL | Via TimestampMixin |

Unique constraint: `(user_id, concept_id)` — name `uq_user_concept`
Composite index: `(user_id, next_review_at)` — name `ix_srs_items_user_next_review`

### streaks
One row per user. Source: `src/streaks/models.py`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK | Via TimestampMixin |
| user_id | UUID | FK -> users, UNIQUE, NOT NULL | |
| current_count | INT | NOT NULL, server_default 0 | |
| longest_count | INT | NOT NULL, server_default 0 | |
| last_activity_date | DATE | NULLABLE | User's local date |
| freeze_remaining | INT | NOT NULL, server_default 0 | Premium feature |
| freeze_used_today | BOOLEAN | NOT NULL, server_default false | |
| created_at | TIMESTAMP | NOT NULL | Via TimestampMixin |
| updated_at | TIMESTAMP | NOT NULL | Via TimestampMixin |

### xp_events
Append-only log of all XP earned. Source: `src/progress/models.py`

**Note**: Does NOT use `TimestampMixin`. Has its own `id` and `created_at`.
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK, default uuid4 | |
| user_id | UUID | FK -> users, INDEX, NOT NULL | |
| source | VARCHAR(30) | NOT NULL | 'lesson', 'review', 'bonus', 'achievement' |
| amount | INT | NOT NULL | |
| metadata | JSON | NULLABLE | `{ lesson_id, achievement_type, etc }` |
| created_at | TIMESTAMP | NOT NULL, INDEX, server_default now() | |

Composite index: `(user_id, created_at)` — name `ix_xp_events_user_created`

**Note**: Python attribute is `metadata_` (mapped to column name `metadata`) to avoid conflict with SQLAlchemy's `metadata`.

### achievements
Unlocked achievements per user. Source: `src/progress/models.py`

**Note**: Does NOT use `TimestampMixin`. Has its own `id` and `unlocked_at`.
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK, default uuid4 | |
| user_id | UUID | FK -> users, INDEX, NOT NULL | |
| achievement_type | VARCHAR(50) | NOT NULL | 'first_lesson', '7_day_streak', etc |
| unlocked_at | TIMESTAMP | NOT NULL | |

Unique constraint: `(user_id, achievement_type)` — name `uq_user_achievement`

---

## Redis Data Structures

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `streak:{user_id}` | Hash | None | `{count, longest, last_date, freeze_remaining, today_completed}` |
| `rate_limit:auth:{ip}` | String + INCR | 15 min (900s) | Auth endpoint rate limiting (max 10 per window) |

**Not yet implemented** (planned for future phases):
| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `leaderboard:weekly:{league}` | Sorted Set | Reset Monday 00:00 UTC | Weekly XP rankings (Phase 5) |
| `features:{user_id}` | Hash | 5 min | `{show_ads, has_premium, streak_freeze}` (Phase 4) |
| `session:{token_jti}` | String | 15 min | Active session validation (not implemented) |

---

## Migration Conventions

```bash
# Generate migration after model changes:
cd api/
alembic revision --autogenerate -m "descriptive_message_here"

# Always review generated migration before running
# Never edit a migration that's already been applied to staging/production
# For data migrations, create a separate migration file (not autogenerate)
```

Current migrations:
- `001_initial_schema.py` — Creates all 11 tables listed above
- `002_add_daily_goal_to_users.py` — Adds `daily_goal` column to users table
