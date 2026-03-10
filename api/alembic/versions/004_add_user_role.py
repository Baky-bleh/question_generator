"""Add role column to users table

Revision ID: 004_add_user_role
Revises: 003_add_video
Create Date: 2026-03-10
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "004_add_user_role"
down_revision = "003_add_video"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(20), nullable=False, server_default="student"),
    )


def downgrade() -> None:
    op.drop_column("users", "role")
