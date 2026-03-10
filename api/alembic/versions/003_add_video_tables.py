"""Add video_lessons, video_progress tables and course_type/content_mode columns

Revision ID: 003_add_video
Revises: 002_add_daily_goal
Create Date: 2026-03-09
"""
from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "003_add_video"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # video_lessons
    op.create_table(
        "video_lessons",
        sa.Column("id", sa.String(100), nullable=False),
        sa.Column("course_id", sa.Uuid(), nullable=False),
        sa.Column("unit_order", sa.Integer(), nullable=False),
        sa.Column("lesson_order", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("video_url", sa.String(500), nullable=False),
        sa.Column("video_duration_seconds", sa.Integer(), nullable=False),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("teacher_name", sa.String(100), nullable=True),
        sa.Column("transcript_url", sa.String(500), nullable=True),
        sa.Column("quiz_id", sa.String(100), nullable=True),
        sa.Column("watch_threshold_percent", sa.Integer(), nullable=False, server_default="80"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_video_lessons_course_id", "video_lessons", ["course_id"])

    # video_progress
    op.create_table(
        "video_progress",
        sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("video_lesson_id", sa.String(100), nullable=False),
        sa.Column("watch_percent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_position_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["video_lesson_id"], ["video_lessons.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "video_lesson_id", name="uq_user_video_lesson"),
    )
    op.create_index("ix_video_progress_user_id", "video_progress", ["user_id"])
    op.create_index("ix_video_progress_video_lesson_id", "video_progress", ["video_lesson_id"])

    # Add course_type and content_mode to courses
    op.add_column("courses", sa.Column("course_type", sa.String(20), nullable=False, server_default="language"))
    op.add_column("courses", sa.Column("content_mode", sa.String(20), nullable=False, server_default="exercise"))


def downgrade() -> None:
    op.drop_column("courses", "content_mode")
    op.drop_column("courses", "course_type")
    op.drop_table("video_progress")
    op.drop_table("video_lessons")
