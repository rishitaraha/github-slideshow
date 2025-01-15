from typing import List

from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response

from layer_manager.constants import ClampToTerrainStatus
from layer_manager.models import Layer
from shared.exception_handling import ValidationErrors
from shared.helpers import get_object_with_uuid, parse_list_param
from shared.services import ImageInfoService

from ..models import Feature, FeatureImage
from ..permissions import (
    HasCreateFeaturePermission,
    HasListFeaturesPermission,
    HasManageBulkFeaturesPermission,
    HasManageFeaturePermission,
    HasViewFeaturePermission,
)
from ..serializers import (
    FeatureSerializer,
    GetFeatureSerializer,
    UpdateFeatureInfoSerializer,
)


class FeatureViewSet(viewsets.ViewSet):
    serializer_class = FeatureSerializer
    permission_classes = (HasViewFeaturePermission,)

    def get_permissions(self):
        if self.action == "list":
            self.permission_classes = (HasListFeaturesPermission,)
        elif self.action == "create":
            self.permission_classes = (HasCreateFeaturePermission,)
        elif self.action in ["partial_update", "destroy"]:
            self.permission_classes = (HasManageFeaturePermission,)

        return super().get_permissions()

    def get_queryset(self, ids: List[str] = None):
        filters = Q()

        if ids:
            filters &= Q(id__in=ids)
        if layer_id := self.request.GET.get("layer_id"):
            filters &= Q(layer_id=layer_id)
        if type := self.request.GET.get("type"):
            filters &= Q(type=type)

        return Feature.objects.filter(filters)

    def get_object(self, pk):
        features = get_object_with_uuid(Feature, id=pk)
        self.check_object_permissions(self.request, features)
        return features

    def list(self, request):
        features = self.get_queryset()
        serializer = self.serializer_class(features, many=True)

        response = {
            "message": "Feature fetched successfully.",
            "data": {
                "features": serializer.data,
            },
        }
        return Response(response)

    def create(self, request):
        feature_data = request.data.copy()
        serializer = self.serializer_class(data=feature_data)
        serializer.is_valid(raise_exception=True)
        feature = serializer.save()

        feature.layer.clamped_status = ClampToTerrainStatus.NOT_CLAMPED.value
        feature.layer.save()

        response = {
            "message": "Feature added successfully to Features.",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        feature = (
            Feature.objects.prefetch_related("featureimage_set__image")
            .filter(id=pk)
            .first()
        )

        self.check_object_permissions(request, feature)

        serializer = GetFeatureSerializer(feature)

        response = {
            "message": "Feature fetched successfully.",
            "data": serializer.data,
        }
        return Response(response)

    def partial_update(self, request, pk=None):
        data = request.data.copy()
        feature = self.get_object(pk)
        serializer = self.serializer_class(feature, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Update clamped status only when geometry has updated.
        if serializer.validated_data.get("geometry", False):
            feature.layer.clamped_status = ClampToTerrainStatus.NOT_CLAMPED.value
            feature.layer.save()

        response = {
            "message": "Feature updated successfully.",
            "data": serializer.data,
        }
        return Response(response)

    def destroy(self, request, pk=None):
        feature = self.get_object(pk)
        feature_images: FeatureImage = FeatureImage.objects.filter(
            feature_id=feature.id
        )

        if len(feature_images) > 0:
            for feature_image in feature_images:
                ImageInfoService.delete_image_info(feature_image.image)

        feature.delete()
        response = {
            "message": "Feature deleted successfully.",
        }
        return Response(response)

    @action(
        detail=False,
        methods=["post", "patch", "delete"],
        url_path="bulk",
        permission_classes=[HasManageBulkFeaturesPermission],
    )
    def bulk_action(self, request: Request):
        if request.method == "POST":
            serializer = self.serializer_class(data=request.data, many=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            layer = serializer.validated_data[0]["layer"]
            feature_count = Feature.objects.get_feature_count(layer.id)

            layer.clamped_status = ClampToTerrainStatus.NOT_CLAMPED.value
            layer.save()

            response = {
                "message": "Features created successfully.",
                "data": {
                    "features": serializer.data,
                    "features_count": feature_count,
                },
            }
            return Response(response)

        elif request.method == "PATCH":
            feature_ids = [
                str(feature_details["id"]) for feature_details in request.data
            ]

            feature_instances = self.get_queryset(ids=feature_ids)

            serializer = self.serializer_class(
                feature_instances, data=request.data, many=True, partial=True
            )
            serializer.is_valid(raise_exception=True)
            updated_feature_instances = serializer.save()

            if len(updated_feature_instances) > 0:
                updated_feature_instances[
                    0
                ].layer.status = ClampToTerrainStatus.NOT_CLAMPED.value
                updated_feature_instances[0].layer.save()

            response = {
                "message": "Features updated successfully.",
                "data": {"features": serializer.data},
            }

            return Response(response)

        elif request.method == "DELETE":
            features_ids = parse_list_param(request.query_params, "ids")

            features_queryset = Feature.objects.filter(
                id__in=features_ids
            ).prefetch_related("featureimage_set")

            layer_ids_count = (
                features_queryset.values_list("layer", flat=True).distinct().count()
            )

            if layer_ids_count > 1:
                raise ValidationError(
                    ValidationErrors.ALL_FEATURES_MUST_HAVE_SAME_LAYER.value
                )

            # Remove all the images related to the features.
            for feature in features_queryset:
                feature_image_queryset = feature.featureimage_set.all()
                for feature_image in feature_image_queryset.iterator():
                    ImageInfoService.delete_image_info(feature_image.image)
            if len(features_queryset) > 0:
                layer_id = features_queryset[0].layer_id
                deleted_features_count, _ = features_queryset.delete()

                feature_count = Feature.objects.get_feature_count(layer_id)

                if feature_count == 0:
                    layer = Layer.objects.get(id=layer_id)
                    layer.clamped_status = ClampToTerrainStatus.NOT_CLAMPED.value
                    layer.save()

                response = {
                    "data": {
                        "features_count": feature_count,
                    },
                    "message": f"{deleted_features_count} features deleted successfully.",
                }
                return Response(response, status=status.HTTP_200_OK)
            else:
                response = {
                    "message": "No features found to delete.",
                }
                return Response(response, status=status.HTTP_404_NOT_FOUND)

    @action(
        detail=True,
        methods=["patch"],
        url_path="info",
        url_name="feature-info",
        serializer_class=UpdateFeatureInfoSerializer,
        permission_classes=[HasManageFeaturePermission],
    )
    def feature_info(self, request: Request, pk=None):
        data = request.data.copy()
        feature = self.get_object(pk)
        feature_image_count = FeatureImage.objects.filter(feature_id=feature.id).count()

        data["existing_feature_image_count"] = feature_image_count

        serializer = self.serializer_class(
            feature,
            data=data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response = {
            "message": "feature info updated successfully",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=False,
        methods=["delete"],
        url_path="info/image/(?P<id>[^/.]+)",
        url_name="delete-feature-image",
        permission_classes=[HasManageFeaturePermission],
    )
    def delete_feature_image(self, request, id=None):
        feature_image = get_object_with_uuid(FeatureImage, id)

        self.check_object_permissions(request, feature_image.feature)

        ImageInfoService.delete_image_info(feature_image.image)
        response = {"message": f"Image {feature_image.image.name} is deleted."}
        return Response(response)
