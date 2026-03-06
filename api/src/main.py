from __future__ import annotations

import importlib
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI

from src.core.exceptions import AppException, app_exception_handler
from src.core.middleware import request_id_middleware, setup_cors


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    yield


def _register_routers(app: FastAPI) -> None:
    router_modules = [
        ("src.auth.router", "router"),
        ("src.auth.router", "users_router"),
        ("src.courses.router", "router"),
        ("src.lessons.router", "router"),
        ("src.progress.router", "router"),
        ("src.srs.router", "router"),
        ("src.streaks.router", "router"),
    ]
    for module_path, attr_name in router_modules:
        try:
            module = importlib.import_module(module_path)
            app.include_router(getattr(module, attr_name))
        except (ImportError, AttributeError):
            pass  # Router not yet created by its agent


def create_app() -> FastAPI:
    app = FastAPI(
        title="LinguaLeap API",
        version="0.1.0",
        lifespan=lifespan,
    )

    setup_cors(app)
    app.middleware("http")(request_id_middleware)
    app.add_exception_handler(AppException, app_exception_handler)

    _register_routers(app)

    return app


app = create_app()
