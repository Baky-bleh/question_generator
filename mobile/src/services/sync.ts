import * as SQLite from "expo-sqlite";
import type { LessonCompleteRequest } from "@lingualeap/types";

const DB_NAME = "lingualeap_cache.db";

interface QueuedCompletion {
  id: number;
  lesson_id: string;
  course_id: string;
  payload: string;
  queued_at: number;
}

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        queued_at INTEGER NOT NULL
      );
    `);
  }
  return db;
}

export async function queueLessonCompletion(
  data: LessonCompleteRequest & { lessonId: string; courseId: string },
): Promise<void> {
  const database = await getDb();
  const { lessonId, courseId, ...body } = data;
  await database.runAsync(
    "INSERT INTO sync_queue (lesson_id, course_id, payload, queued_at) VALUES (?, ?, ?, ?)",
    [lessonId, courseId, JSON.stringify(body), Date.now()],
  );
}

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const database = await getDb();
  const rows = await database.getAllAsync<QueuedCompletion>(
    "SELECT * FROM sync_queue ORDER BY queued_at ASC",
  );

  let synced = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const { apiClient } = await import("@/services/api");
      const body = JSON.parse(row.payload) as LessonCompleteRequest;
      await apiClient.lessons.complete(row.lesson_id, row.course_id, body);
      await database.runAsync("DELETE FROM sync_queue WHERE id = ?", [row.id]);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

export async function getPendingCount(): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sync_queue",
  );
  return result?.count ?? 0;
}
