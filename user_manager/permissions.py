from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.viewsets import ViewSet

from org_manager.validators import is_object_in_same_org

from .constants import UserType


class IsSupportUser(permissions.BasePermission):
    """
    Allows permission for Support User.
    """

    # Checks if request user is Support user type.
    def has_permission(self, request: Request, view: ViewSet):
        if request.user and request.user.is_authenticated:
            return request.user.type == UserType.SUPPORT.value
        return False

    # Checks happen when check_object_permissions() is called.
    def has_object_permission(self, request: Request, view: ViewSet, obj):
        return request.user.type == UserType.SUPPORT.value


class IsOrgAdmin(permissions.BasePermission):
    """
    Allows permission for Org admin.
    """

    # Checks if request user is Org admin user type.
    def has_permission(self, request: Request, view: ViewSet):
        if request.user and request.user.is_authenticated:
            return request.user.type == UserType.ORG_ADMIN.value
        return False

    # Checks happen when check_object_permissions() is called.
    def has_object_permission(self, request: Request, view: ViewSet, obj):
        return (
            is_object_in_same_org(request, obj)
            and request.user.type == UserType.ORG_ADMIN.value
        )


class IsSelf(permissions.IsAuthenticated):
    """
    Allows permission to object user owned by self.
    """

    message = "Operation not permitted for other member"

    def has_object_permission(self, request: Request, view: ViewSet, obj):
        return obj == request.user
