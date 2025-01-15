from itertools import chain

from django.db import models
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iteration_manager.permissions import HasManageDatasetPermission
from org_manager.permissions import IsFeatureFlagEnabled
from processing_workflow_manager.models import DefaultPreset, OrgPreset

from ..serializers import (
    DatasetQueryParamSerializer,
    DefaultPresetSerializer,
    OrgPresetSerializer,
)


class PresetViewSet(ViewSet):
    permission_classes = [IsFeatureFlagEnabled, HasManageDatasetPermission]

    def list(self, request):
        dataset_query_param_serializer = DatasetQueryParamSerializer(data=request.GET)
        dataset_query_param_serializer.is_valid(raise_exception=True)
        dataset_query_param_validated_data = (
            dataset_query_param_serializer.validated_data
        )
        parent_dataset = dataset_query_param_validated_data.get(
            "iteration_dataset"
        ) or dataset_query_param_validated_data.get("merged_dataset")
        site = getattr(parent_dataset, "iteration", parent_dataset).site
        self.check_object_permissions(self.request, site)

        default_presets = DefaultPreset.objects.all().order_by(
            models.Case(
                models.When(name="Standard", then=0),
                default=1,
                output_field=models.IntegerField(),
            )
        )
        org = getattr(request.user, "org")
        org_presets = OrgPreset.objects.filter(org=org)
        default_presets = DefaultPresetSerializer(default_presets, many=True).data
        org_presets = OrgPresetSerializer(org_presets, many=True).data
        response = {
            "message": "presets_fetched_successfully",
            "data": {"presets": list(chain(default_presets, org_presets))},
        }
        return Response(response)
