from rest_framework import serializers

from .mixins import QueryParamSerializerMixin


class ListViewQueryParamsSerializer(QueryParamSerializerMixin):
    search = serializers.CharField(required=False)
    page = serializers.IntegerField(required=False)
    page_size = serializers.IntegerField(required=False)
    include_fields = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
        required=False,
        allow_null=True,
    )
    exclude_fields = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
        required=False,
        allow_null=True,
    )
