import csv
from io import StringIO

from django.core.exceptions import ObjectDoesNotExist
from django.core.validators import FileExtensionValidator
from django.db import transaction
from rest_framework import serializers

from ..constants import KpiType
from ..models import SiteKPI
from ..validators import validate_kpi_csv
from .kpi_serializers import StockVolumeKpiSerializer


class UploadStockVolumeKpiSerializer(serializers.Serializer):
    site = serializers.UUIDField()
    stock_volume_kpi_file = serializers.FileField(
        validators=[FileExtensionValidator(["csv"])]
    )

    class Meta:
        fields = ("site", "stock_volume_kpi_file")

    def validate(self, data):
        # Default validation.
        data = super().validate(data)

        # Opening CSV file.
        uploaded_file = StringIO(data["stock_volume_kpi_file"].read().decode())
        csv_data_list = list(csv.reader(uploaded_file))

        stock_volume_kpi = csv_data_list[1:]

        # Removing csv header, since we only need the data.
        total_csv_fields = len(stock_volume_kpi[0])

        data["stock_volume_kpi"] = stock_volume_kpi

        # Validating CSV.
        validate_kpi_csv(
            stock_volume_kpi,
            total_csv_fields,
            kpi_type=KpiType.STOCK_VOLUME.value,
        )

        return data

    # Ref: https://docs.djangoproject.com/en/4.1/topics/db/transactions/.
    @transaction.atomic
    def create(self, validated_data):
        site_id = validated_data["site"]
        stock_volume_kpi = validated_data["stock_volume_kpi"]

        created_stock_volume_kpi = []
        updated_stock_volume_kpi = []

        for stock_volume_data in stock_volume_kpi:
            stock_volume_data_list = stock_volume_data
            production_year = stock_volume_data_list[0]
            production_month = stock_volume_data_list[1]
            stock_volume_value = stock_volume_data_list[2]

            # FIXME: Move bulk create/update to SiteKPI model manager.
            try:
                site_kpi_object = SiteKPI.objects.get(
                    site_id=site_id,
                    year=production_year,
                    month=production_month,
                )
                site_kpi_object.stock_volume = stock_volume_value

                site_kpi_object.save(
                    update_fields=[
                        "stock_volume",
                    ]
                )

                updated_stock_volume_kpi.append(site_kpi_object)
            except ObjectDoesNotExist:
                site_kpi_object = SiteKPI.objects.create(
                    site_id=site_id,
                    year=production_year,
                    month=production_month,
                    stock_volume=stock_volume_value,
                )
                created_stock_volume_kpi.append(site_kpi_object)

        return {
            "created_stock_volume_kpi": created_stock_volume_kpi,
            "updated_stock_volume_kpi": updated_stock_volume_kpi,
        }

    def to_representation(self, stock_volume_kpi):
        created_stock_volume_kpi_serializer = StockVolumeKpiSerializer(
            stock_volume_kpi["created_stock_volume_kpi"], many=True
        )
        updated_stock_volume_kpi_serializer = StockVolumeKpiSerializer(
            stock_volume_kpi["updated_stock_volume_kpi"], many=True
        )

        return {
            "created_stock_volume_kpi": created_stock_volume_kpi_serializer.data,
            "updated_stock_volume_kpi": updated_stock_volume_kpi_serializer.data,
        }
