from rest_framework import serializers

from processing_manager.helpers import is_connected_to_processing

from ..models import CustomUser


class LoggedUserSerializer(serializers.ModelSerializer):
    # Fields.
    feature_flags = serializers.DictField(source="org.get_feature_flags")
    is_connected_with_processing = serializers.SerializerMethodField()

    # Serializers field methods.
    def get_is_connected_with_processing(self, user: CustomUser):
        return is_connected_to_processing(user.org_id)

    # Meta.
    class Meta:
        model = CustomUser

        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "type",
            "feature_flags",
            "is_active",
            "last_login",
            "is_connected_with_processing",
        )
