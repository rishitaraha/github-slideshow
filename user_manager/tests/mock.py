from rest_framework import status


def mocked_get_user_info():
    return {
        "email": "testusername@gmail.com",
    }, status.HTTP_200_OK
