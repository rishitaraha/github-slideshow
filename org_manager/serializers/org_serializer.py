from rest_framework import serializers

from shared.helpers import get_download_url

from ..models import Organisation


class OrgSerializer(serializers.ModelSerializer):
    org_access_token = serializers.CharField(
        source="access_token.token", read_only=True
    )
    feature_flags = serializers.DictField(source="get_feature_flags")

    class Meta:
        model = Organisation
        fields = ("id", "name", "feature_flags", "org_access_token")
        read_only_fields = ("id", "feature_flags", "org_access_token")


class GetMyOrgSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()

    def get_logo(self, org: Organisation) -> str:
        return get_download_url(org.logo) if org.logo else None

    class Meta:
        model = Organisation
        fields = ("id", "name", "logo")
