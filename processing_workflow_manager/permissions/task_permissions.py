from rest_framework import permissions

from rainbow.env_variables import EnvVariable


class IsApiKeyPresent(permissions.BasePermission):
    def has_permission(self, request, view):
        param = (
            getattr(request, "GET")
            if request.method == "GET"
            else getattr(request, "data")
        )

        return param.get("API_KEY") == EnvVariable.MCLI_API_KEY.value
