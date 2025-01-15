from rest_framework import serializers

from shared.serializers import ListViewQueryParamsSerializer, QueryParamSerializerMixin


class AltitudeQueryParamsSerializer(QueryParamSerializerMixin):
    iterations = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)
    latitude = serializers.DecimalField(required=True, max_digits=11, decimal_places=8)
    longitude = serializers.DecimalField(required=True, max_digits=11, decimal_places=8)


class IterationsQueryParamsSerializer(ListViewQueryParamsSerializer):
    site_id = serializers.UUIDField(required=True)
