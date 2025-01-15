from contextlib import asynccontextmanager

from fastapi import FastAPI
from redis_om import Migrator as RedisMigrator

from .db import PostgresManager
from .shared import logger
from .shared.api_client import AioHttpClient
from .shared.aws import AwsManager
from .shared.constants import EnvVariable


def setup_sentry():
    if EnvVariable.ENVIRONMENT.value in ["production", "uat"]:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration

        logger.info("Setup Sentry")
        sentry_sdk.init(
            dsn=EnvVariable.SENTRY_DSN.value,
            send_default_pii=True,
            integrations=[FastApiIntegration()],
            environment=EnvVariable.ENVIRONMENT.value,
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Before running queries, we need to run migrations to set up the indexes that Redis OM will use.
    RedisMigrator().run()

    await PostgresManager.setup()

    # Setup Sentry.
    setup_sentry()

    yield

    await AioHttpClient.close()
    await PostgresManager.destroy()
    await AwsManager.destroy()
