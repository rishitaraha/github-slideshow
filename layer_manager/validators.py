# All access tags should belong to same org.
from typing import List

from django.core.exceptions import ValidationError

from shared.exception_handling import ValidationErrors

from .models import AccessTag


def access_tags_org_validator(access_tags: List[AccessTag], org_id: str):
    org_of_access_tags = [access_tag.org_id for access_tag in access_tags]

    if len(set(org_of_access_tags)) > 1:
        raise ValidationError(ValidationErrors.INVALID_ACCESS_TAGS_ORG.value)

    # Layer and access tags should belong to same org.
    if org_of_access_tags and org_of_access_tags[0] != org_id:
        raise ValidationError(ValidationErrors.INVALID_LAYER_ACCESS_TAGS.value)
