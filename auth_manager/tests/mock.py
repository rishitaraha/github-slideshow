from rest_framework import status


def mocked_get_cognito_token():
    return {
        "refresh_token": 518651.65,
        "access_token": 218.26,
    }, status.HTTP_200_OK


def mocked_get_cognito_token_failed():
    return {}, status.HTTP_401_UNAUTHORIZED
