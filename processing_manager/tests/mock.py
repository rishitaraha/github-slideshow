from rest_framework import status


def mocked_connect():
    return ({"rp_org_name": "Some org name"}, status.HTTP_200_OK)


def mocked_disconnect():
    return ({}, status.HTTP_200_OK)


def mocked_create_org():
    return (
        {"id": "d0a47b19-48f9-46b9-93f9-ad4ed7906179"},
        status.HTTP_200_OK,
    )


def mocked_generate_token():
    return (
        {"connection_token": "260cb449c5dc7352fe71f2173d9beba675f90596"},
        status.HTTP_200_OK,
    )
