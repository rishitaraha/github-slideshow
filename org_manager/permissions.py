from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request
from rest_framework.viewsets import ViewSet

from shared.helpers import get_object_or_none

from .feature_flags import FeatureFlag
from .models import Organisation, OrganisationAccessToken


def is_feature_flag_enabled(org: Organisation, feature_flag: FeatureFlag):
    feature_dict = org.get_feature_flags()
    if not feature_dict.get(feature_flag.value, False):
        raise PermissionDenied()


def has_org_access_token(request: Request):
    org_token = request.headers.get("X-Org-Access-Token")

    if not org_token:
        return False

    if org_access_token := get_object_or_none(OrganisationAccessToken, token=org_token):
        return org_access_token.is_active

    return False


class IsFeatureFlagEnabled(permissions.BasePermission):
    """
    Permission class to check if a feature flag is enabled for the logged user's organization.
    """

    # Checks if request user has feature permission.
    def has_permission(self, request: Request, view: ViewSet):
        if request.user and request.user.is_authenticated:
            features_dict = request.user.org.get_feature_flags()

            feature_flag_for_endpoint = FeatureFlag.VIEW_SET_FLAGS.get(
                view.basename
            ) or FeatureFlag.URL_FLAGS.get(request.resolver_match.url_name)

            if not feature_flag_for_endpoint:
                raise ValueError("Feature flag is not present for the resource")
            return features_dict.get(feature_flag_for_endpoint.value)
        return False


class HasOrgAccessToken(permissions.BasePermission):
    def has_permission(self, request: Request, view):
        return has_org_access_token(request)
