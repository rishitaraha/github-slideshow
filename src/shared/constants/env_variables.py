import os
from enum import Enum


class EnvVariable(Enum):
    BUCKET_NAME = os.environ["BUCKET_NAME"]
    ENVIRONMENT = os.environ["ENVIRONMENT"]
    SENTRY_DSN = os.environ["SENTRY_DSN"]
    API_ENGINE_URL = os.environ["API_ENGINE_URL"]
    # TODO: Handle using microservice authentication.
    API_ENGINE_API_KEY = os.environ["API_ENGINE_API_KEY"]

    # Database.
    DB_HOSTNAME = os.environ["RDS_HOSTNAME"]
    DB_NAME = os.environ["RDS_DB_NAME"]
    DB_PASSWORD = os.environ["RDS_PASSWORD"]
    DB_PORT = os.environ["RDS_PORT"]
    DB_USERNAME = os.environ["RDS_USERNAME"]
