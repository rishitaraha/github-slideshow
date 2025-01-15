from typing import Optional

from aiohttp import ClientResponse, ClientSession, TCPConnector


# Ref; https://docs.aiohttp.org/en/stable/.
class AioHttpClient:
    session: Optional[ClientSession] = None

    @classmethod
    async def _get_session(cls) -> ClientSession:
        if not cls.session:
            connector = TCPConnector(limit_per_host=5)
            cls.session = ClientSession(connector=connector)
        return cls.session

    @classmethod
    async def _close_session(cls):
        if cls.session:
            await cls.session.close()

    @classmethod
    async def get(cls, url: str, **kwargs) -> ClientResponse:
        session = await cls._get_session()
        response = await session.get(url, **kwargs)
        return response

    @classmethod
    async def post(cls, url: str, data=None, **kwargs) -> ClientResponse:
        session = await cls._get_session()
        response = await session.post(url, data=data, **kwargs)
        return response

    @classmethod
    async def close(cls):
        await cls._close_session()
