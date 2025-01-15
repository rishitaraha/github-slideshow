from rainbow.env_variables import EnvVariable

from .session import cognito_session


def get_cognito_access_token(code):
    response = cognito_session.post(
        "/oauth2/token",
        data={
            "client_id": EnvVariable.COGNITO_CLIENT_ID.value,
            "client_secret": EnvVariable.COGNITO_CLIENT_SECRET.value,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": EnvVariable.COGNITO_REDIRECTION_URI.value,
        },
    )

    response_data = response.json()

    return response_data, response.status_code


def get_cognito_user_info(access_token):
    response = cognito_session.get(
        "/oauth2/userInfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    response_data = response.json()

    return response_data, response.status_code
