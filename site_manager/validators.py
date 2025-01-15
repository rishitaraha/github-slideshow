from typing import List

from rest_framework.exceptions import ValidationError

from shared.exception_handling import ValidationErrors
from shared.validators import is_number

from .constants import KpiType, NumberOfCSVFields


def validate_kpi_csv(
    kpi_data: List[dict],
    total_csv_fields: int,
    kpi_type: str = KpiType.PRODUCTION.value,
):
    number_of_expected_fields = 0

    if kpi_type == KpiType.PRODUCTION.value:
        number_of_expected_fields = NumberOfCSVFields.PRODUCTION_KPI.value

    elif kpi_type == KpiType.STOCK_VOLUME.value:
        number_of_expected_fields = NumberOfCSVFields.STOCK_VOLUME_KPI.value

    elif kpi_type == KpiType.SAFETY_INDEX.value:
        number_of_expected_fields = NumberOfCSVFields.SAFETY_INDEX_KPI.value

    else:
        raise ValidationError(ValidationErrors.INVALID_KPI_TYPE.value)

    if number_of_expected_fields != total_csv_fields:
        raise ValidationError(ValidationErrors.INVALID_KPI_CSV.value)

    # Validating CSV data.
    for data_list in kpi_data:
        for value in data_list:
            if not is_number(value):
                raise ValidationError(ValidationErrors.INVALID_KPI_CSV_DATA.value)

        # Common field(month) validation for all KPIs.
        kpi_month = data_list[1]
        if int(kpi_month) < 1 or int(kpi_month) > 12:
            raise ValidationError(ValidationErrors.INVALID_KPI_CSV_DATA.value)
