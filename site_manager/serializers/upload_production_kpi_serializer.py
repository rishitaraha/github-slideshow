import csv
from io import StringIO

from django.core.exceptions import ObjectDoesNotExist
from django.core.validators import FileExtensionValidator
from django.db import transaction
from rest_framework import serializers

from ..models import SiteKPI
from ..validators import validate_kpi_csv
from .kpi_serializers import ProductionKpiSerializer


class UploadProductionKpiSerializer(serializers.Serializer):
    site = serializers.UUIDField()
    production_kpi_file = serializers.FileField(
        validators=[FileExtensionValidator(["csv"])]
    )

    class Meta:
        fields = ("site", "production_kpi_file")

    def validate(self, data):
        # Default validation.
        data = super().validate(data)

        # Opening CSV file.
        uploaded_file = StringIO(data["production_kpi_file"].read().decode())
        csv_data_list = list(csv.reader(uploaded_file))

        total_csv_fields = len(csv_data_list[0])

        # Removing csv header, since we only need the data.
        production_kpi = csv_data_list[1:]
        data["production_kpi"] = production_kpi

        # Validating CSV.
        validate_kpi_csv(production_kpi, total_csv_fields)

        return data

    # Ref: https://docs.djangoproject.com/en/4.1/topics/db/transactions/.
    @transaction.atomic
    def create(self, validated_data):
        site_id = validated_data["site"]
        production_kpi = validated_data["production_kpi"]

        created_production_kpi = []
        updated_production_kpi = []

        for production_kpi_data in production_kpi:
            production_kpi_data_list = production_kpi_data
            production_year = production_kpi_data_list[0]
            production_month = production_kpi_data_list[1]
            actual_ore_production = production_kpi_data_list[2]
            target_ore_production = production_kpi_data_list[3]
            actual_overburden_production = production_kpi_data_list[4]
            target_overburden_production = production_kpi_data_list[5]

            # FIXME: Move bulk create/update to SiteKPI model manager.
            try:
                site_kpi_object = SiteKPI.objects.get(
                    site_id=site_id,
                    year=production_year,
                    month=production_month,
                )
                site_kpi_object.actual_ore_production = actual_ore_production
                site_kpi_object.target_ore_production = target_ore_production
                site_kpi_object.actual_overburden_production = (
                    actual_overburden_production
                )
                site_kpi_object.target_overburden_production = (
                    target_overburden_production
                )

                site_kpi_object.save(
                    update_fields=[
                        "target_ore_production",
                        "target_overburden_production",
                        "actual_ore_production",
                        "actual_overburden_production",
                    ]
                )

                updated_production_kpi.append(site_kpi_object)
            except ObjectDoesNotExist:
                site_kpi_object = SiteKPI.objects.create(
                    site_id=site_id,
                    year=production_year,
                    month=production_month,
                    target_overburden_production=target_overburden_production,
                    target_ore_production=target_ore_production,
                    actual_overburden_production=actual_overburden_production,
                    actual_ore_production=actual_ore_production,
                )
                created_production_kpi.append(site_kpi_object)

        return {
            "created_production_kpi": created_production_kpi,
            "updated_production_kpi": updated_production_kpi,
        }

    def to_representation(self, production_targets):
        created_production_kpi_serializer = ProductionKpiSerializer(
            production_targets["created_production_kpi"], many=True
        )
        updated_production_kpi_serializer = ProductionKpiSerializer(
            production_targets["updated_production_kpi"], many=True
        )

        return {
            "created_production_kpi": created_production_kpi_serializer.data,
            "updated_production_kpi": updated_production_kpi_serializer.data,
        }
