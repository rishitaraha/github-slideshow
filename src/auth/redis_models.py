from datetime import datetime

from redis_om import Field, HashModel, NotFoundError


class AccessTokenCache(HashModel):
    token: str = Field(primary_key=True, index=True)
    expires_at: datetime

    @classmethod
    def exists(cls, pk) -> bool:
        try:
            cls.get(pk)
        except NotFoundError:
            return False

        return True
