from psycopg2 import connect as PGConnect

from ..shared import logger
from ..shared.constants import EnvVariable


class PostgresManager:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(PostgresManager, cls).__new__(cls)
            cls._instance.connection = None
        return cls._instance

    def get_connection(self):
        if not self.connection:
            self.connection = PGConnect(
                dbname=EnvVariable.DB_NAME.value,
                user=EnvVariable.DB_USERNAME.value,
                password=EnvVariable.DB_PASSWORD.value,
                host=EnvVariable.DB_HOSTNAME.value,
                port=EnvVariable.DB_PORT.value,
            )
            logger.info("Connected to PostgreSQL")

        return self.connection

    def disconnect(self):
        if self.connection:
            self.connection.close()
            logger.info("Disconnected from PostgreSQL")
            self.connection = None
        else:
            logger.info("Not connected to PostgreSQL")
