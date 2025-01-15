from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from shared.exception_handling import ValidationErrors
from shared.helpers import convert_geometry_3d_to_2d

from ...models import Feature
from .feature_image_serializer import FeatureImageSerializer


class BaseFeatureSerializer(serializers.ModelSerializer):
    def to_representation(self, instance: Feature):
        """returning wkt without srid from geometry field"""
        serialized_instance = super().to_representation(instance)

        if serialized_instance["geometry"] is not None:
            geometry_2d = convert_geometry_3d_to_2d(instance.geometry)
            serialized_instance["geometry"] = geometry_2d.wkt

        return serialized_instance

    class Meta:
        model = Feature


class FeatureListSerializer(serializers.ListSerializer):
    def validate(self, data):
        feature_ids = [feature["id"] for feature in data]

        layer_ids_count = (
            Feature.objects.filter(id__in=feature_ids)
            .values_list("layer", flat=True)
            .distinct()
            .count()
        )

        if layer_ids_count > 1:
            raise ValidationError(
                ValidationErrors.ALL_FEATURES_MUST_HAVE_SAME_LAYER.value
            )

        return super().validate(data)

    def create(self, validated_data):
        feature_objects = [self.child.create(attrs) for attrs in validated_data]
        self.child.Meta.model.objects.bulk_create(feature_objects)

        return feature_objects

    def update(self, instances, validated_data):
        # Feature hash map to efficiently update each feature.
        features_map = {str(instance.id): instance for instance in instances}

        updated_feature_instances = []

        # Extract out all the writable fields.
        writable_fields = []
        for field in self.child.Meta.fields:
            if field not in self.child.Meta.read_only_fields:
                writable_fields.append(field)

        # Update feature instance with new data.
        for feature_data in validated_data:
            validated_data_feature_id = str(feature_data["id"])
            if validated_data_feature_id in features_map:
                for field in feature_data.keys():
                    if field != "id":
                        setattr(
                            features_map[validated_data_feature_id],
                            field,
                            feature_data[field],
                        )
                        updated_feature_instances.append(
                            features_map[validated_data_feature_id]
                        )

        self.child.Meta.model.objects.bulk_update(
            updated_feature_instances, fields=writable_fields
        )
        return updated_feature_instances


class FeatureSerializer(BaseFeatureSerializer):
    id = serializers.UUIDField()

    class Meta:
        model = Feature
        fields = (
            "id",
            "name",
            "geometry",
            "properties",
            "type",
            "created_at",
            "layer",
        )
        read_only_fields = ("created_at", "id")
        list_serializer_class = FeatureListSerializer
        extra_kwargs = {
            "type": {"required": True},
        }

    def create(self, validated_data):
        instance = Feature(**validated_data)
        if isinstance(self._kwargs["data"], dict):
            instance.save()

        return instance


class GetFeatureSerializer(BaseFeatureSerializer):
    images = FeatureImageSerializer(many=True, source="featureimage_set")

    class Meta:
        model = Feature
        fields = ("id", "layer", "info", "images", "attributes", "geometry")
