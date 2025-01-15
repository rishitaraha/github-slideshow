from rest_framework import serializers

from ...constants import BaseReference
from ...models import HeapBoundary


class HeapBoundarySerializer(serializers.ModelSerializer):
    base_iteration = serializers.SerializerMethodField(method_name="get_base_iteration")

    class Meta:
        model = HeapBoundary
        fields = "__all__"

    def get_base_iteration(self, heap: HeapBoundary):
        if heap.base_reference == BaseReference.OtherIterationDsm.value:
            return heap.base_iteration.name

    def to_representation(self, instance):
        """returning geojson with geometry field"""
        result = super().to_representation(instance)
        if result.get("geometry"):
            result["geometry"] = instance.geometry.wkt
        return result
