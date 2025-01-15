from rest_framework import serializers

from processing_workflow_manager.models import DefaultPreset, OrgPreset


class OrgPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgPreset
        fields = "__all__"


class DefaultPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DefaultPreset
        fields = "__all__"
