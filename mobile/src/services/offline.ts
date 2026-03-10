import * as SQLite from "expo-sqlite";
import type { LessonContent } from "@lingualeap/types";

const DB_NAME = "lingualeap_cache.db";

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS lesson_cache (
        lesson_id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        content TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );
    `);
  }
  return db;
}

export async function prefetchLessons(
  courseId: string,
  lessonIds: string[],
): Promise<void> {
  const database = await getDb();

  for (const lessonId of lessonIds) {
    const existing = await database.getFirstAsync<{ lesson_id: string }>(
      "SELECT lesson_id FROM lesson_cache WHERE lesson_id = ?",
      [lessonId],
    );

    if (existing) continue;

    try {
      // Import apiClient lazily to avoid circular deps
      const { apiClient } = await import("@/services/api");
      const lesson = await apiClient.lessons.get(lessonId, courseId);
      const content = await apiClient.lessons.fetchContent(lesson.content_url);

      await database.runAsync(
        "INSERT OR REPLACE INTO lesson_cache (lesson_id, course_id, content, cached_at) VALUES (?, ?, ?, ?)",
        [lessonId, courseId, JSON.stringify(content), Date.now()],
      );
    } catch {
      // Skip lessons that fail to fetch
    }
  }
}

export async function getCachedLesson(lessonId: string): Promise<LessonContent | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ content: string }>(
    "SELECT content FROM lesson_cache WHERE lesson_id = ?",
    [lessonId],
  );

  if (!row) return null;
  return JSON.parse(row.content) as LessonContent;
}

export async function isLessonCached(lessonId: string): Promise<boolean> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ lesson_id: string }>(
    "SELECT lesson_id FROM lesson_cache WHERE lesson_id = ?",
    [lessonId],
  );
  return row !== null;
}

export async function clearLessonCache(): Promise<void> {
  const database = await getDb();
  await database.runAsync("DELETE FROM lesson_cache");
}
