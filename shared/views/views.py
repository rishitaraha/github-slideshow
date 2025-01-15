from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

from rainbow.env_variables import EnvVariable


@api_view(["GET"])
def index(request):
    return HttpResponse(
        """<h1 style="display: flex; justify-content: center;">Welcome to Aereo Cloud</h1>"""
    )


@api_view(["GET"])
def ping(request):
    response = {
        "data": "pong",
    }
    return Response(response)


@api_view(["GET"])
def environment(request):
    response = {
        "data": {"login_mode": EnvVariable.LOGIN_MODE.value},
    }
    return Response(response)
