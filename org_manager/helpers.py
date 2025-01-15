from django.http import HttpRequest
from rest_framework.exceptions import NotAuthenticated

from org_manager.models import Organisation, OrganisationAccessToken
from shared.exception_handling import ApiErrors
from shared.helpers import get_object_or_none


def get_current_org(request: HttpRequest) -> Organisation:
    """
    Returns the current logged organisation.
    """

    if request.user.is_authenticated:
        return request.user.org

    elif org_token := request.headers.get("X-Org-Access-Token"):
        if org_access_token := get_object_or_none(
            OrganisationAccessToken, token=org_token
        ):
            if org_access_token.is_active:
                return org_access_token.org
            else:
                raise NotAuthenticated(ApiErrors.ORG_ACCESS_TOKEN_IS_DEACTIVATED.value)
        else:
            raise NotAuthenticated(ApiErrors.INVALID_ORG_ACCESS_TOKEN.value)

    raise NotAuthenticated()
