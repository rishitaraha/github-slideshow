from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.http import HttpRequest


class CaseInsensitiveAuthBackend(ModelBackend):
    """
    Allows Users to login using case insensitive email.
    """

    def authenticate(self, request: HttpRequest, email=None, password=None, **kwargs):
        UserModel = get_user_model()

        try:
            user = UserModel.objects.get(email__iexact=email)
        except UserModel.DoesNotExist:
            return None

        if user.check_password(password):
            return user

        return None
