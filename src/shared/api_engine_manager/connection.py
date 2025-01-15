import json

from requests import Session
from requests.compat import urljoin
from requests.exceptions import HTTPError, RequestException, Timeout

from ..constants import EnvVariable


# Ref: https://www.geeksforgeeks.org/session-objects-python-requests/
class ApiEngineSession(Session):
    def __init__(self, base_url, api_key, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.base_url = base_url
        self.api_key = api_key

    def request(self, method, url, params=None, data=None, **kwargs):
        """
        Sends an HTTP request and handles JSON serialization, headers, and errors.

        Args:
            method (str): HTTP method (e.g., 'GET', 'POST').
            url (str): Endpoint path.
            params (dict, optional): Query parameters.
            data (dict or str, optional): Request payload.
            **kwargs: Additional arguments passed to the underlying request method.

        Returns:
            requests.Response: The HTTP response received.

        Raises:
            HTTPError: If the HTTP request returned an unsuccessful status code.
            RequestException: For other request-related errors.
        """
        try:
            # Construct the full URL.
            full_url = urljoin(self.base_url, url)

            # Determine if this is a files upload request.
            is_files_request = "files" in kwargs

            # Serialize JSON data if applicable.
            if data and isinstance(data, dict) and not is_files_request:
                data = json.dumps(data)
                kwargs["json"] = json.loads(data)

            # Prepare headers
            headers = kwargs.pop("headers", {})

            if not is_files_request:
                headers["Content-Type"] = "application/json"

            headers["X-API-KEY"] = self.api_key
            kwargs["headers"] = headers

            # Send the HTTP request using the parent Session's request method.
            response = super().request(
                method=method, url=full_url, params=params, data=data, **kwargs
            )

        except (Timeout, HTTPError, RequestException) as e:
            raise Exception(e)

        return response


api_engine = ApiEngineSession(
    EnvVariable.API_ENGINE_URL.value, EnvVariable.API_ENGINE_API_KEY.value
)
