import os
from enum import Enum


class EnvVariable(Enum):
    # Project Config.
    DEBUG = os.environ["DEBUG"]
    ENVIRONMENT = os.environ["ENVIRONMENT"]
    SENTRY_DSN = os.environ.get("SENTRY_DSN")

    # Authentication Server URLs.
    API_ENGINE_URL = os.environ["API_ENGINE_URL"]
    MASTER_SERVER_VERIFY_TOKEN_URL = os.environ["MASTER_SERVER_VERIFY_TOKEN_URL"]

    # Redis. Ref: https://redis.io/docs/stack/get-started/tutorials/stack-python/
    REDIS_OM_URL = os.environ["REDIS_OM_URL"]

    # Database.
    DB_HOSTNAME = os.environ["RDS_HOSTNAME"]
    DB_NAME = os.environ["RDS_DB_NAME"]
    DB_PASSWORD = os.environ["RDS_PASSWORD"]
    DB_PORT = os.environ["RDS_PORT"]
    DB_USERNAME = os.environ["RDS_USERNAME"]
    DB_POOL_MAX_CONNS = os.environ.get("DB_POOL_MAX_CONNS", 4)
    DB_POOL_MAX_IDLE_TIME = os.environ.get(
        "DB_POOL_MAX_IDLE_TIME", 300
    )  # Default is 5 Min.
