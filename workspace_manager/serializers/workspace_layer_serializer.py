from rest_framework import serializers

from iteration_manager.models import Iteration
from layer_manager.models import Layer
from site_manager.models import Site

from ..models import WorkspaceLayer


class WorkspaceLayerSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(
        queryset=Layer.objects.all(), required=False
    )
    dsm_iteration_id = serializers.PrimaryKeyRelatedField(
        queryset=Iteration.objects.all(), required=False
    )

    class Meta:
        model = WorkspaceLayer
        fields = ("id", "show", "z_index", "dsm_iteration_id")


class WorkspaceLayerSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = ("id", "name")


class WorkspaceLayerIterationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Iteration
        fields = ("id", "name", "date", "info")
