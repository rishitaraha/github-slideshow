from rest_framework import serializers
from rest_framework.exceptions import NotAuthenticated
from rest_framework_simplejwt.tokens import AccessToken

from processing_manager.models import Connection as ProcessingConnection
from shared.helpers import get_object_or_none
from user_manager.models import CustomUser


class ProcessingAuthSerializer(serializers.Serializer):
    ra_access_token = serializers.CharField(write_only=True)
    org_connection_token = serializers.CharField(write_only=True)
    email = serializers.CharField(read_only=True)

    # Using key `role` for user type because processing team is using it in master server.
    role = serializers.CharField(read_only=True)

    def validate(self, data):
        # Validating user access token.
        access_token = AccessToken(data["ra_access_token"], verify=True)

        # Get user.
        user_id = access_token.get("user_id")
        user: CustomUser = get_object_or_none(CustomUser, id=user_id)

        if not user or not user.is_active:
            raise NotAuthenticated()

        processing_connection = get_object_or_none(
            ProcessingConnection, connection_token=data["org_connection_token"]
        )

        # Checking if processing org is connected with user's org.
        if not processing_connection or user.org != processing_connection.org:
            raise NotAuthenticated()

        data["email"] = user.email
        data["role"] = user.type

        return super().validate(data)
