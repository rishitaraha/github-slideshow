from typing import Optional

from psycopg_pool import AsyncConnectionPool
from typing_extensions import Self

from ..shared import logger
from ..shared.constants import EnvVariable


class PostgresManager:
    """
    A singleton class for managing PostgreSQL database connections using psycopg3's AsyncConnectionPool.
    This class provides a connection pool for efficient database access.
    """

    _instance: Optional[Self] = None

    # The minimum number of connections to maintain in the pool.
    MIN_CONNECTIONS = 1

    # The maximum number of connections allowed in the pool.
    MAX_CONNECTIONS = int(EnvVariable.DB_POOL_MAX_CONNS.value)

    # The connections in the pool will shrink back to MIN_CONNECTIONS after the extra connections have been unused for more than MAX_IDLE_TIME (in seconds).
    MAX_IDLE_TIME = int(EnvVariable.DB_POOL_MAX_IDLE_TIME.value)

    def __new__(cls, *args, **kwargs) -> Self:
        if cls._instance is None:
            cls._instance = super().__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self) -> None:
        if hasattr(self, "_initialized") and self._initialized:
            return
        self._initialized = True

        conninfo = "host={} port={} dbname={} user={} password={}".format(
            EnvVariable.DB_HOSTNAME.value,
            EnvVariable.DB_PORT.value,
            EnvVariable.DB_NAME.value,
            EnvVariable.DB_USERNAME.value,
            EnvVariable.DB_PASSWORD.value,
        )

        self.pool = AsyncConnectionPool(
            conninfo,
            min_size=self.MIN_CONNECTIONS,
            max_size=self.MAX_CONNECTIONS,
            open=False,
            max_idle=self.MAX_IDLE_TIME,
        )

    async def generate_vector_tile(
        self, layer_id: str, z: int, x: int, y: int
    ) -> Optional[bytes]:
        """
        Generate a vector tile from the database.

        Args:
            layer_id (str): The ID of the layer.
            z (int): The zoom level.
            x (int): The X coordinate of the tile.
            y (int): The Y coordinate of the tile.

        Returns:
            Optional[bytes]: The generated tile in binary format, or None if an error occurs.
        """

        async with self.pool.connection() as connection:
            query = "SELECT get_tile(%(layer_id)s, %(zoom)s, %(x)s, %(y)s);"
            params = {
                "layer_id": layer_id,
                "zoom": z,
                "x": x,
                "y": y,
            }

            cursor = await connection.execute(query, params)
            result = await cursor.fetchone()

            tile: Optional[bytes] = result[0] if result else None

        return tile

    @classmethod
    async def setup(cls) -> Self:
        """
        Initialize the connection pool and return the singleton instance.

        Returns:
            PostgresManager: The initialized singleton instance of PostgresManager.
        """

        instance = cls()
        await instance.pool.open(True)

        return instance

    @classmethod
    async def destroy(cls) -> None:
        """
        Close all connections in the connection pool and reset the singleton instance.
        """

        if cls._instance is not None:
            logger.info("Closing all connections in the DB pool.")
            await cls._instance.pool.close()
            cls._instance = None
