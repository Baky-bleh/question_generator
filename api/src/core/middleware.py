from __future__ import annotations

import uuid

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware


def setup_cors(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


async def request_id_middleware(request: Request, call_next: object) -> Response:
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response: Response = await call_next(request)  # type: ignore[call-arg]
    response.headers["X-Request-ID"] = request_id
    return response
