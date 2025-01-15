from rest_framework import serializers

from user_manager.models import UserGroup
from user_manager.validators import (
    same_org_access_tags_and_user_group,
    same_org_users_and_user_group,
)


class UserGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserGroup
        fields = ("id", "name", "users", "access_tags")
        read_only_fields = ("id",)

    def validate(self, data):
        org = self.instance.org
        if users := data.get("users"):
            same_org_users_and_user_group(org, users)
        if access_tags := data.get("access_tags"):
            same_org_access_tags_and_user_group(org, access_tags)
        return data


class AddUserGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserGroup
        fields = ("id", "name", "org", "users", "access_tags")
        read_only_fields = ("id",)
        extra_kwargs = {"org": {"write_only": True}}

    def validate(self, data):
        same_org_users_and_user_group(data["org"], data["users"])
        same_org_access_tags_and_user_group(data["org"], data["access_tags"])
        return data


class UserGroupListSerializer(serializers.ModelSerializer):
    members_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserGroup
        fields = ("id", "name", "members_count")
        read_only_fields = ("id", "members_count")
