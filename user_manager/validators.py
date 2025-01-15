import re
from typing import List

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from layer_manager.models import AccessTag
from org_manager.models import Organisation
from shared.exception_handling import ValidationErrors

from .models import CustomUser


def same_org_users_and_user_group(org: Organisation, users: List[CustomUser]):
    org_of_users = [user.org_id for user in users]

    # If set of org_of_users is greater than 1, it means different orgs are there which is not allowed.
    if len(set(org_of_users)) > 1:
        raise ValidationError(ValidationErrors.SAME_ORG_USERS.value)

    # # Only those users are allowed which has the same org as UserGroup.
    if org_of_users and org_of_users[0] != org.id:
        raise ValidationError(ValidationErrors.SAME_ORG_USERS_AND_USER_GROUP.value)


def same_org_access_tags_and_user_group(
    org: Organisation, access_tags: List[AccessTag]
):
    org_of_access_tags = [access_tag.org_id for access_tag in access_tags]

    # If set of org_of_access_tags is greater than 1, it means different orgs are there which is not allowed.
    if len(set(org_of_access_tags)) > 1:
        raise ValidationError(ValidationErrors.SAME_ORG_ACCESS_TAGS.value)

    # Only those access_tags are allowed which has the same org as UserGroup.
    if org_of_access_tags and org_of_access_tags[0] != org.id:
        raise ValidationError(
            ValidationErrors.SAME_ORG_ACCESS_TAGS_AND_USER_GROUP.value
        )


class UppercaseValidator(object):

    """The password must contain at least 1 uppercase letter, A-Z."""

    def validate(self, password, user=None):
        if not re.findall("[A-Z]", password):
            raise ValidationError(ValidationErrors.UPPER_CASE_LETTER_NOT_PRESENT.value)

    def get_help_text(self):
        return _("Your password must contain at least 1 uppercase letter, A-Z.")


class LowercaseValidator(object):

    """The password must contain at least 1 lowercase letter, a-z."""

    def validate(self, password, user=None):
        if not re.findall("[a-z]", password):
            raise ValidationError(ValidationErrors.LOWER_CASE_LETTER_NOT_PRESENT.value)

    def get_help_text(self):
        return _("Your password must contain at least 1 lowercase letter, a-z.")


class SpecialCharValidator(object):

    """The password must contain at least 1 special character @#$%!^&*"""

    def validate(self, password, user=None):
        if not re.findall("[@#$%!^&*]", password):
            raise ValidationError(ValidationErrors.SPECIAL_CASE_CHAR_NOT_PRESENT.value)

    def get_help_text(self):
        return _(
            "Your password must contain at least 1 special character: " + "@#$%!^&*"
        )
