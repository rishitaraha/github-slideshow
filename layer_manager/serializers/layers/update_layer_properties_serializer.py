from rest_framework import serializers

from ...models import Layer


class UpdateLayerPropertiesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Layer
        fields = ("properties",)

    def update(self, instance, validated_data):
        data = validated_data.get("properties")

        if instance.properties is None:
            updated_properties = data
        else:
            updated_properties = instance.properties.copy()
            for key in data:
                updated_properties[key] = data[key]

        instance.properties = updated_properties
        instance.save(update_fields=["properties"])
        return instance
