from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q, QuerySet
from django.db.models import Value as V
from django.db.models.functions import Concat
from django.utils.translation import gettext_lazy as _

from .constants import UserType


class UserQuerySet(QuerySet):
    def search(self, query: str) -> QuerySet:
        return (
            self.annotate(full_name=Concat("first_name", V(" "), "last_name"))
            .filter(
                Q(email__icontains=query)
                | Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(full_name__icontains=query)
            )
            .distinct()
        )

    def with_active(self, is_active: bool):
        return self.filter(is_active=is_active)

    def get_only_members(self):
        return self.filter(type=UserType.MEMBER.value)


class UserManager(BaseUserManager):
    def get_queryset(self):
        return UserQuerySet(self.model, using=self._db)

    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError(_("The email must be set"))
        if not password:
            raise ValueError(_("The password must be set"))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)

        # raise Validation Error invalid password.
        validate_password(password)

        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email=None, password=None, **extra_fields):
        """
        A method to create superuser by using command `python manage.py createsuperuser`
        """

        extra_fields.setdefault("type", UserType.SUPPORT.value)
        extra_fields.setdefault("first_name", email.split("@")[0])
        return self.create_user(email, password, **extra_fields)
