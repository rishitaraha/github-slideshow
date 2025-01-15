from django.utils.cache import add_never_cache_headers

from rainbow.env_variables import EnvVariable


class CustomHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        add_never_cache_headers(response)

        # If debug mode is on, disable security headers.
        if EnvVariable.DEBUG.value == "1":
            return response

        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        response.headers["Strict-Transport-Security"] = "max-age=3600"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "all"
        response.headers["Pragma"] = "no-cache"
        return response
