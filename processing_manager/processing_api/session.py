import json
from urllib.parse import parse_qs, urlencode, urljoin, urlparse, urlunparse

import requests

from rainbow.env_variables import EnvVariable


class ProcessingSession(requests.Session):
    def __init__(self, *args, **kwargs):
        super(ProcessingSession, self).__init__(*args, **kwargs)
        self.base_url = EnvVariable.PROCESSING_SERVER_URL.value

    def request(self, method, url, params=None, data=None, *args, **kwargs):

        # To attach processing master token in every request as a query parameter.
        url_parts = list(urlparse(url))
        query = parse_qs(url_parts[4])  # url_parts[4] contains query parameters.
        query.update({"MASTER_TOKEN": EnvVariable.PROCESSING_MASTER_TOKEN.value})
        url_parts[4] = urlencode(query)
        url = urlunparse(url_parts)

        url = urljoin(self.base_url, url)

        if data and isinstance(data, dict):
            data = json.dumps(data)

        return super(ProcessingSession, self).request(
            method, url, params, data=data, *args, **kwargs
        )


processing_api = ProcessingSession()
processing_api.headers.update(
    {
        "Content-Type": "application/json",
    }
)
