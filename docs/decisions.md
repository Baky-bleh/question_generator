# Architecture Decision Records

> When we make a significant technical choice, record it here so future agents understand WHY, not just WHAT.

---

## ADR-001: Static Course Content on S3/CDN

**Status**: Accepted
**Date**: 2026-03-05
**Context**: Course content (exercises, audio, images) changes rarely (weekly at most), but is read millions of times per day. Storing it in PostgreSQL and querying it per-lesson-request would be wasteful and slow.
**Decision**: Course content is compiled into versioned JSON files, uploaded to S3, and served via CloudFront CDN. The API only stores metadata (course ID, version, S3 manifest URL). Clients download and cache content locally.
**Consequences**: Database load is dramatically reduced. Offline mode becomes straightforward (just cache the JSON). Trade-off: content updates require a build-and-deploy pipeline, not a simple DB update. Course authors need a separate tool/process.

## ADR-002: Server-Side Answer Validation

**Status**: Accepted
**Date**: 2026-03-05
**Context**: The client has the exercise JSON including correct answers. We could validate client-side for instant feedback.
**Decision**: All answer validation happens server-side. Client sends the user's answer to the API, API returns correct/incorrect. Client does NOT check answers locally.
**Consequences**: Prevents cheating (users can't inspect client code to find answers). Enables server-side analytics on common mistakes. Trade-off: requires network round-trip for each answer (mitigated by fast API response times). Offline mode queues answers and validates on sync.

## ADR-003: PostgreSQL Over DynamoDB

**Status**: Accepted
**Date**: 2026-03-05
**Context**: Duolingo uses DynamoDB. We considered it. Our team is Python-first with no NoSQL experience.
**Decision**: Use PostgreSQL as primary database. Add Redis for leaderboards and caching.
**Consequences**: Rich query capability for analytics and ad-hoc analysis. Excellent Python ecosystem (SQLAlchemy, Alembic). Trade-off: requires more manual scaling at extreme volume, but managed services (Supabase, Neon) handle this up to ~100K users.

## ADR-004: RevenueCat for Subscription Management

**Status**: Accepted
**Date**: 2026-03-05
**Context**: We need to support Apple IAP, Google Play Billing, and Stripe (web) with unified subscription state. Building this from scratch is 2-3 months of work and ongoing maintenance.
**Decision**: Use RevenueCat as unified subscription layer. Their SDK handles store interactions on mobile, their webhooks notify our backend of subscription events.
**Consequences**: Saves months of development. Adds a dependency and cost at scale. Free under $2.5K monthly tracked revenue, then usage-based pricing.

## ADR-005: Monorepo Structure

**Status**: Accepted
**Date**: 2026-03-05
**Context**: Three projects (API, mobile, web) that share types and constants.
**Decision**: Single git repository with `/api`, `/mobile`, `/web`, `/shared` directories.
**Consequences**: Atomic commits across frontend + backend. Shared types stay in sync. Trade-off: CI runs all checks on every PR (mitigated by path filters in GitHub Actions).

## ADR-006: Expo + React Native Over Flutter

**Status**: Accepted
**Date**: 2026-03-05
**Context**: Need cross-platform mobile app. Flutter (Dart) vs React Native (TypeScript).
**Decision**: React Native with Expo SDK.
**Consequences**: Share API client and types with Next.js web app. Massive npm ecosystem. Expo handles build, deploy, OTA updates. Trade-off: React Native performance is slightly lower than Flutter for heavy animations, but Reanimated library closes the gap for our use case.

---

> Add new ADRs as `ADR-NNN: Title` with Status, Date, Context, Decision, Consequences.
