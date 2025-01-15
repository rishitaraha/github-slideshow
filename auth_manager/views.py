from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from rest_framework_simplejwt.authentication import JWTTokenUserAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from auth_manager.serializers import LoginCognitoSerializer, LoginSerializer
from rainbow import logger
from rainbow.env_variables import EnvVariable
from shared.constants import LOGIN_MODE
from shared.exception_handling import ApiErrors, AuthException
from shared.helpers import get_object_with_uuid
from user_manager.models import CustomUser
from user_manager.permissions import IsSelf

from .cognito_api import get_cognito_access_token, get_cognito_user_info
from .serializers import ProcessingAuthSerializer, VerifyTokenSerializer


class AuthViewSet(ViewSet):
    permission_classes = [AllowAny]

    @action(
        detail=False,
        methods=["post"],
    )
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response = {
            "message": "User logged in successfully.",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=False,
        methods=["post"],
        url_path="login/cognito",
    )
    def login_cognito(self, request):
        serializer = LoginCognitoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not EnvVariable.COGNITO_DOMAIN.value:
            raise NotFound()

        # Send token to cognito token API to get access_token.
        response_data, status_code = get_cognito_access_token(
            code=serializer.data["code"]
        )

        if status_code != 200:
            logger.error(f"Cognito Error: {response_data}")
            raise AuthException(
                ApiErrors.AUTHENTICATION_FAILED.value,
            )

        access_token = response_data["access_token"]

        # Send token to cognito userInfo API to get user details.
        response_data, status_code = get_cognito_user_info(access_token)

        if status_code != 200:
            logger.error(f"Cognito Error: {response_data}")
            raise AuthException(
                ApiErrors.AUTHENTICATION_FAILED.value,
            )

        # Check if the Cognito user is in database or not.
        user = CustomUser.objects.filter(email__iexact=response_data["email"]).first()

        if not user:
            raise AuthException(
                ApiErrors.AUTHENTICATION_FAILED.value,
            )

        refresh = RefreshToken.for_user(user)
        refresh_token = str(refresh)
        access_token = str(refresh.access_token)

        response = {
            "message": "User logged in successfully.",
            "data": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "login_mode": LOGIN_MODE.SSO.value,
                "name": user.name,
            },
        }

        return Response(response)

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[IsSelf],
    )
    def logout(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)

            # Retrieve and check if logout request is for self only.
            user_from_token = JWTTokenUserAuthentication().get_user(token)

            user = get_object_with_uuid(CustomUser, id=user_from_token.id)
            self.check_object_permissions(self.request, user)

            token.blacklist()
            response = {
                "message": "User logged out successfully.",
            }
            return Response(response, status=status.HTTP_205_RESET_CONTENT)
        except PermissionDenied as e:
            response = {"message": str(e)}
            return Response(response, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            response = {"message": str(e)}
            return Response(response, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=False,
        methods=["post"],
        url_path="token/verify",
    )
    def token_verify(self, request):
        serializer = VerifyTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        response = {
            "message": "Token is valid.",
        }
        return Response(response)

    @action(detail=False, methods=["post"])
    def processing(self, request):
        serializer = ProcessingAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        response = {
            "message": "User is valid.",
            "data": serializer.data,
        }
        return Response(response)
