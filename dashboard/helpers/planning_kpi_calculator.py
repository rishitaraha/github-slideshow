from typing import List

from iteration_manager.models import Iteration
from layer_manager.constants import FeatureType, LayerType
from layer_manager.models import AreaCategory, Feature, Layer


def get_area_for_layer_category(category: AreaCategory, layers: List[Layer]):
    polygon_area_list = Feature.objects.filter(
        layer__in=layers.filter(area_category=category.value),
        type=FeatureType.POLYGON.value,
    ).values_list("properties__area", flat=True)

    area = sum(map(float, polygon_area_list)) * 0.000001

    if area:
        formatted_area = "{:5f}".format(area)
        return formatted_area


def calculate_total_area_for_layer_categories(
    site_id: str, financial_year_ending: int, month: int
):
    total_area = {}
    financial_year_starting = financial_year_ending - 1
    year_to_compare: int
    """
    If the month is less than 4. Then
    the year for which we need the iterations for will fall under
    the financial year ending. Otherwise the starting year.
    """

    if month < 4:
        year_to_compare = financial_year_ending
    else:
        year_to_compare = financial_year_starting

    iterations = Iteration.objects.filter(
        site_id=site_id, date__month=month, date__year=year_to_compare
    )

    layers = Layer.objects.filter(iteration__in=iterations, type=LayerType.VECTOR.value)

    if area := get_area_for_layer_category(AreaCategory.PLANNED_AND_ACTIVE, layers):
        total_area[AreaCategory.PLANNED_AND_ACTIVE.value] = area

    if area := get_area_for_layer_category(AreaCategory.PLANNED_AND_INACTIVE, layers):
        total_area[AreaCategory.PLANNED_AND_INACTIVE.value] = area

    if area := get_area_for_layer_category(AreaCategory.UNPLANNED_AND_ACTIVE, layers):
        total_area[AreaCategory.UNPLANNED_AND_ACTIVE.value] = area

    if area := get_area_for_layer_category(
        AreaCategory.UNPLANNED_AND_ACTIVE_BEYOND_CRITICAL_BOUNDARY, layers
    ):
        total_area[
            AreaCategory.UNPLANNED_AND_ACTIVE_BEYOND_CRITICAL_BOUNDARY.value
        ] = area

    if total_area:
        return total_area
