from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config.api_route_class import CustomAPIRoute
from .config.custom_response import CustomResponse
from .exceptions.handler import setup_exception_handlers
from .middleware import CustomResponseHeaders, LoggingMiddleware
from .routers.api_router import router
from .shared.constants import EnvVariable
from .shared.helpers import unwrap_boolean
from .startup import lifespan

DEBUG = unwrap_boolean(EnvVariable.DEBUG.value)

# Setup app.
app = FastAPI(
    title="Tile Server",
    description="A microservice for serving the map tiles",
    default_response_class=CustomResponse,
    docs_url="/api-doc" if DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

# Setup Exception Handlers.
setup_exception_handlers(app)

# CORS Middleware.
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware.
app.add_middleware(LoggingMiddleware)

if not DEBUG:
    app.add_middleware(CustomResponseHeaders)


app.router.route_class = CustomAPIRoute

# Routers.
app.include_router(router)


@app.get("/ping")
async def ping():
    return {"data": "pong"}
