from rest_framework import serializers
from rest_framework.exceptions import NotAuthenticated, ValidationError
from rest_framework_simplejwt.serializers import TokenVerifySerializer

from org_manager.models import OrganisationAccessToken
from shared.exception_handling import ApiErrors, ValidationErrors
from shared.helpers import get_object_or_none

from ..constants import TokenType


class VerifyTokenSerializer(TokenVerifySerializer):
    type = serializers.CharField()

    def validate(self, data):
        token = data.get("token")
        type = data.get("type")

        if type == TokenType.ORG_ACCESS_TOKEN.value:
            org_access_token = get_object_or_none(OrganisationAccessToken, token=token)

            if org_access_token and org_access_token.is_active:
                return data
            else:
                raise NotAuthenticated(ApiErrors.INVALID_ORG_ACCESS_TOKEN.value)

        elif type == TokenType.USER_ACCESS_TOKEN.value:
            return super().validate(data)

        else:
            raise ValidationError(ValidationErrors.INVALID_TOKEN_TYPE.value)
