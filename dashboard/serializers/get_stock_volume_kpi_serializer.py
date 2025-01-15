from django.shortcuts import get_object_or_404
from rest_framework import serializers

from org_manager.permissions import has_org_access_token
from org_manager.validators import validate_org_ownership
from shared.exception_handling import ValidationErrors
from site_manager.models import Site
from site_manager.permissions import has_view_site_permission_or_403

from ..helpers import get_stock_volume_for_financial_year


class GetStockVolumeKpiSerializer(serializers.Serializer):
    site_id = serializers.UUIDField()
    financial_year_ending = serializers.IntegerField()

    def validate(self, data):
        validation_errors = {}

        site_id = data.get("site_id")
        site = get_object_or_404(Site, id=site_id)

        request = self.context["request"]

        is_owner_of_org = validate_org_ownership(request, site)
        if not is_owner_of_org:
            validation_errors["site_id"] = ValidationErrors.SITE_NOT_FOUND.value

        # Validate if the user has view site permissions or org access token is present in request
        if not has_org_access_token(request):
            has_view_site_permission_or_403(request.user, site)

        if validation_errors:
            raise serializers.ValidationError(validation_errors)

        return super().validate(data)

    def to_representation(self, instance):
        response = super().to_representation(instance)
        site_id = response["site_id"]
        financial_year_ending = response["financial_year_ending"]

        # Calculating monthly stock volume.
        monthly_stock_volume = get_stock_volume_for_financial_year(
            site_id, financial_year_ending
        )

        response["monthly_stock_volume"] = monthly_stock_volume
        response[
            "financial_year"
        ] = f"{financial_year_ending - 1}-{financial_year_ending}"

        return response
