from rest_framework import serializers

from shared.serializers import ImageInfoSerializer, UploadImageSerializer

from ...models import FeatureImage


class FeatureImageSerializer(serializers.ModelSerializer):
    image = ImageInfoSerializer()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return data["image"]

    class Meta:
        model = FeatureImage
        fields = ["image"]


class CreateFeatureImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureImage
        exclude = ["image"]

    def create(self, validated_data):
        feature = validated_data["feature"]
        image_name_list = self.context["image_name_list"]
        upload_image_serializer = UploadImageSerializer(
            data=validated_data, context=self.context
        )
        if upload_image_serializer.is_valid(raise_exception=True):
            upload_image_serializer.save()

        images = upload_image_serializer.data["images"]

        FeatureImage.objects.bulk_create(
            [
                FeatureImage(feature=feature, image_id=images[index]["id"])
                for index in range(len(image_name_list))
            ]
        )

        return validated_data
