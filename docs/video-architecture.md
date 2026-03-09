# Video Architecture

> Last synced: 2026-03-09 by doc-sync agent (Phase 3A complete)

## Overview

Math courses use a video-first learning model. Users watch teacher videos,
then take quizzes to assess understanding. The video system is designed with
a storage abstraction so the app works identically in development (local files)
and production (Mux streaming).

## Storage Abstraction

```
VideoStorage (src/video/storage.py)
│
├── LocalVideoBackend (VIDEO_BACKEND=local)
│     Stores: content/videos/*.mp4
│     Serves: FastAPI static files mount
│     URL format: http://localhost:8000/static/videos/{filename}.mp4
│     Encoding: None — serves original mp4
│     Analytics: None — only watch_percent tracked in DB
│
└── MuxVideoBackend (VIDEO_BACKEND=mux)
      Stores: Mux cloud storage
      Serves: Mux multi-CDN (Fastly, Cloudflare, Akamai)
      URL format: https://stream.mux.com/{playback_id}.m3u8
      Encoding: Automatic adaptive bitrate (360p → 1080p)
      Analytics: Mux Data (startup time, rebuffering, engagement, drop-off)
```

## Configuration

```bash
# Development (default)
VIDEO_BACKEND=local
VIDEO_LOCAL_DIR=content/videos

# Production
VIDEO_BACKEND=mux
MUX_TOKEN_ID=your-token-id
MUX_TOKEN_SECRET=your-token-secret
MUX_WEBHOOK_SECRET=your-webhook-secret
```

## Data Flow

### Video Playback
1. Mobile calls GET /api/v1/video-lessons/{id}
2. API returns video_url (local path or Mux HLS URL) + user progress
3. Mobile plays URL with expo-av Video component
4. Every 30 seconds: mobile calls POST /video-lessons/{id}/progress
5. API updates video_progress table + Redis cache
6. When watch_percent >= watch_threshold_percent: quiz unlocks

### Quiz Flow
1. Mobile calls GET /api/v1/video-lessons/{id}/quiz
2. API checks video_progress.completed — returns 403 if not met
3. If unlocked: returns quiz exercises (same JSON format as language lessons)
4. Quiz submit/complete use existing lesson endpoints (no new code)
5. XP awarded same as language lessons

### Video Upload (Admin/Content Creator)
**Development:**
1. Place mp4 file in content/videos/
2. Call POST /api/v1/admin/video-lessons with metadata + filename
3. API creates video_lessons record with local URL

**Production (Mux):**
1. Call POST /api/v1/admin/video-lessons with metadata + file
2. Backend uploads to Mux via API
3. Mux processes and returns playback_id
4. API stores Mux HLS URL in video_lessons record
5. Mux webhook notifies when encoding complete

## Migration Path (Local → Mux)

When deploying to production:
1. Set VIDEO_BACKEND=mux in env vars
2. Add Mux credentials to env vars
3. Run migration script: reads all video_lessons with local URLs,
   uploads each mp4 to Mux, updates video_url to Mux HLS URL
4. No mobile app changes needed — expo-av plays both formats

## Mobile Player Requirements

- expo-av Video component handles both mp4 and HLS
- Custom controls: play/pause, seek bar, fullscreen, playback speed
- Resume from last position (last_position_seconds from API)
- Progress reporting: POST every 30 seconds with current position
- Offline: videos are NOT cached offline (too large). Require connection.
  Quiz exercises CAN be cached offline (same as language lessons).

## Why Mux for Production

Selected for production based on:
- Adaptive bitrate: critical for mobile on varying connections
- Engagement analytics: watch drop-off data to improve course content
- Per-second billing: no rounding, predictable costs
- HLS output: works directly with expo-av, no custom player needed
- ~$50/month at moderate usage, $20/month free credit on starter plan
- See ADR-007 in docs/decisions.md for full comparison
