from rest_framework import serializers

from ..models import Connection


class ConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Connection
        fields = (
            "id",
            "processing_org_id",
            "processing_org_name",
            "connection_token",
        )
        read_only_fields = ("id", "processing_org_name")

    def create(self, validated_data):
        org = self.context["logged_user_org"]
        validated_data["org"] = org
        return super().create(validated_data)
