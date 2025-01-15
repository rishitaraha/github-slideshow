from rest_framework import permissions
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request

from org_manager.validators import is_object_in_same_org
from shared.exception_handling import ValidationErrors
from shared.helpers import get_object_with_uuid, parse_list_param
from site_manager.permissions import has_view_site_permission
from user_manager.models import CustomUser

from ..models import Feature, Layer
from .layer_permissions import can_manage_layers, has_view_layer_permission


def can_manage_feature_layer(user: CustomUser, layer: Layer):
    return (
        can_manage_layers(user, layer.iteration)
        and has_view_site_permission(user, layer.site)
        and has_view_layer_permission(user, layer)
    )


def has_view_feature_layer_permission(user: CustomUser, layer: Layer):
    return has_view_site_permission(user, layer.site) and has_view_layer_permission(
        user, layer
    )


class HasViewFeaturePermission(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, feature):
        if not super().has_permission(request, view):
            return False

        # Permission checks for user.
        if not is_object_in_same_org(request, feature):
            return False

        if request.user.is_org_admin or has_view_feature_layer_permission(
            request.user, feature.layer
        ):
            return True

        return False


class HasListFeaturesPermission(permissions.IsAuthenticated):
    def has_permission(self, request: Request, view):
        if not super().has_permission(request, view):
            return False

        layer_id = request.GET.get("layer_id", None)
        if not layer_id:
            raise ValidationError(ValidationErrors.LAYER_ID_REQUIRED.value)

        layer: Layer = get_object_with_uuid(Layer, id=layer_id)

        if not is_object_in_same_org(request, layer):
            return False
        if request.user.is_org_admin:
            return True

        return has_view_feature_layer_permission(request.user, layer)


class HasCreateFeaturePermission(permissions.IsAuthenticated):
    def has_permission(self, request: Request, view):
        if not super().has_permission(request, view):
            return False

        if not "layer" in request.data:
            raise ValidationError(ValidationErrors.LAYER_ID_REQUIRED.value)

        layer_id = request.data["layer"]
        layer: Layer = get_object_with_uuid(Layer, id=layer_id)

        if not is_object_in_same_org(request, layer):
            return False

        if request.user.is_org_admin:
            return True

        return can_manage_feature_layer(request.user, layer)


class HasManageFeaturePermission(permissions.IsAuthenticated):
    def has_object_permission(self, request: Request, view, feature: Feature):
        if not super().has_permission(request, view):
            return False

        if not is_object_in_same_org(request, feature):
            return False

        if request.user.is_org_admin:
            return True

        return can_manage_feature_layer(request.user, feature.layer)


class HasManageBulkFeaturesPermission(permissions.IsAuthenticated):
    def has_permission(self, request: Request, view):
        if not super().has_permission(request, view):
            return False

        feature_objects_list = request.data

        if request.method == "PATCH":
            feature_ids = [feature["id"] for feature in feature_objects_list]

            feature_objects_list = list(
                Feature.objects.filter(id__in=feature_ids).values("layer")
            )

        elif request.method == "DELETE":
            features_ids = parse_list_param(request.query_params, "ids")

            feature_objects_list = list(
                Feature.objects.filter(id__in=features_ids).values("layer")
            )

        layer_ids_list = list(
            set([feature["layer"] for feature in feature_objects_list])
        )

        for layer_id in layer_ids_list:
            layer: Layer = get_object_with_uuid(Layer, id=str(layer_id))

            if not is_object_in_same_org(request, layer):
                return False

            if request.user.is_org_admin:
                continue

            if not can_manage_feature_layer(request.user, layer):
                return False

        return True
