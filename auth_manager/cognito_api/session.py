from urllib.parse import urljoin

from requests import Session
from requests.exceptions import HTTPError, RequestException, Timeout
from rest_framework.exceptions import APIException

from rainbow.env_variables import EnvVariable


class CognitoSession(Session):
    """
    Custom wrapper session class to provide default headers and logging to external session requests.

    Args:
        base_url: URL to Host server
    """

    def __init__(self, base_url, *args, **kwargs):
        super(CognitoSession, self).__init__(*args, **kwargs)
        self.base_url = base_url
        self.headers.update(
            {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        )

    def request(self, method, url, params=None, data=None, *args, **kwargs):
        try:
            url = urljoin(self.base_url, url)

            response = super(CognitoSession, self).request(
                method, url, params, data=data, *args, **kwargs
            )

        except (Timeout, HTTPError, RequestException) as e:
            raise APIException(e)
        return response


cognito_session = CognitoSession(EnvVariable.COGNITO_DOMAIN.value)
