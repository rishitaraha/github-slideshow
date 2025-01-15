from rest_framework import serializers

from ...models import AccessTag


class AccessTagsSerializer(serializers.ModelSerializer):
    user_groups_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = AccessTag
        fields = (
            "id",
            "name",
            "color",
            "created_at",
            "user_groups_count",
            "org",
        )
        read_only_fields = ("id", "created_at", "user_groups_count")
        extra_kwargs = {"org": {"write_only": True}}
