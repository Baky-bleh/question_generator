from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from src.core.config import settings
from src.core.database import Base

# Import all models so Base.metadata is populated
from src.auth.models import RefreshToken, User, UserAuthProvider  # noqa: F401
from src.courses.models import Course  # noqa: F401
from src.progress.models import Achievement, LessonCompletion, UserCourseEnrollment, XPEvent  # noqa: F401
from src.srs.models import SRSItem  # noqa: F401
from src.streaks.models import Streak  # noqa: F401
from src.subscriptions.models import Subscription  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: object) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = create_async_engine(settings.DATABASE_URL)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
