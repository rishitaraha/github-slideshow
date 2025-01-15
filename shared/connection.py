import json

from requests import Session
from requests.compat import urljoin
from requests.exceptions import HTTPError, RequestException, Timeout
from rest_framework import status
from rest_framework.exceptions import APIException

from rainbow.env_variables import EnvVariable
from shared.exception_handling import MicroserviceException


# Ref: https://www.geeksforgeeks.org/session-objects-python-requests/
class DefaultSession(Session):
    """
    Custom wrapper session class to provide default headers and logging to external session requests.

    Args:
        base_url: URL to Host server
    """

    def __init__(self, base_url, *args, **kwargs):
        super(DefaultSession, self).__init__(*args, **kwargs)
        self.base_url = base_url
        self.headers.update(
            {
                "Content-Type": "application/json",
            }
        )

    def request(self, method, url, params=None, data=None, *args, **kwargs):
        try:
            url = urljoin(self.base_url, url)

            if data and isinstance(data, dict):
                data = json.dumps(data)

            response = super(DefaultSession, self).request(
                method, url, params, data=data, *args, **kwargs
            )
            if response.status_code >= status.HTTP_400_BAD_REQUEST:
                raise MicroserviceException(response.json(), code=response.status_code)

        except (Timeout, HTTPError, RequestException) as e:
            raise APIException(e)
        return response


analytics_engine_api = DefaultSession(EnvVariable.ANALYTICS_ENGINE_URL.value)
