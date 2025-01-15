from datetime import datetime, timedelta
from uuid import uuid4

import jwt


def generate_jwt_token():
    """
    Generates a sample jwt token for testing.
    """

    # Define the payload (data) to include in the JWT token.
    payload = {
        "token_type": "access",
        "user_id": str(uuid4()),
        "jti": str(uuid4()),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }

    # Define a secret key to sign the JWT token
    secret_key = "mysecretkey"

    # Generate the JWT token using the payload and secret key
    token = jwt.encode(payload, secret_key, algorithm="HS256")

    return token
