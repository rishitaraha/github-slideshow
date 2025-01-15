import csv
from io import StringIO

from django.core.exceptions import ObjectDoesNotExist
from django.core.validators import FileExtensionValidator
from django.db import transaction
from rest_framework import serializers

from ..constants import KpiType
from ..models import SiteKPI
from ..validators import validate_kpi_csv
from .kpi_serializers import SafetyIndexKpiSerializer


class UploadSafetyIndexKpiSerializer(serializers.Serializer):
    site = serializers.UUIDField()
    safety_index_kpi_file = serializers.FileField(
        validators=[FileExtensionValidator(["csv"])]
    )

    class Meta:
        fields = ("site", "safety_index_kpi_file")

    def validate(self, data):
        # Default validation.
        data = super().validate(data)

        # Opening CSV file.
        uploaded_file = StringIO(data["safety_index_kpi_file"].read().decode())
        csv_data_list = list(csv.reader(uploaded_file))

        total_csv_fields = len(csv_data_list[0])

        # Removing csv header, since we only need the data.
        safety_index_kpi = csv_data_list[1:]

        data["safety_index_kpi"] = safety_index_kpi

        # Validating CSV.
        validate_kpi_csv(
            safety_index_kpi,
            total_csv_fields,
            kpi_type=KpiType.SAFETY_INDEX.value,
        )

        return data

    # Ref: https://docs.djangoproject.com/en/4.1/topics/db/transactions/.
    @transaction.atomic
    def create(self, validated_data):
        site_id = validated_data["site"]
        safety_index_kpi = validated_data["safety_index_kpi"]

        created_safety_index_kpi = []
        updated_safety_index_kpi = []

        for safety_index_data in safety_index_kpi:
            safety_index_data_list = safety_index_data
            production_year = safety_index_data_list[0]
            production_month = safety_index_data_list[1]
            haul_road_distance_under_gradient_issue = safety_index_data_list[2]
            haul_road_distance_under_width_issue = safety_index_data_list[3]

            # FIXME: Move bulk create/update to SiteKPI model manager.
            try:
                site_kpi_object = SiteKPI.objects.get(
                    site_id=site_id,
                    year=production_year,
                    month=production_month,
                )
                site_kpi_object.haul_road_distance_under_gradient_issue = (
                    haul_road_distance_under_gradient_issue
                )
                site_kpi_object.haul_road_distance_under_width_issue = (
                    haul_road_distance_under_width_issue
                )

                site_kpi_object.save(
                    update_fields=[
                        "haul_road_distance_under_gradient_issue",
                        "haul_road_distance_under_width_issue",
                    ]
                )

                updated_safety_index_kpi.append(site_kpi_object)
            except ObjectDoesNotExist:
                site_kpi_object = SiteKPI.objects.create(
                    site_id=site_id,
                    year=production_year,
                    month=production_month,
                    haul_road_distance_under_gradient_issue=haul_road_distance_under_gradient_issue,
                    haul_road_distance_under_width_issue=haul_road_distance_under_width_issue,
                )
                created_safety_index_kpi.append(site_kpi_object)

        return {
            "created_safety_index_kpi": created_safety_index_kpi,
            "updated_safety_index_kpi": updated_safety_index_kpi,
        }

    def to_representation(self, safety_index_kpi):
        created_safety_index_kpi_serializer = SafetyIndexKpiSerializer(
            safety_index_kpi["created_safety_index_kpi"], many=True
        )
        updated_safety_index_kpi_serializer = SafetyIndexKpiSerializer(
            safety_index_kpi["updated_safety_index_kpi"], many=True
        )

        return {
            "created_safety_index_kpi": created_safety_index_kpi_serializer.data,
            "updated_safety_index_kpi": updated_safety_index_kpi_serializer.data,
        }
