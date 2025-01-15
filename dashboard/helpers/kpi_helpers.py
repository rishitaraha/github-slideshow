import calendar

from shared.helpers import get_financial_year_months, get_object_or_none
from site_manager.models import SiteKPI


def get_stock_volume_for_financial_year(site_id: str, financial_year_ending: int):
    monthly_stock_volume = {}
    financial_year_months = get_financial_year_months(financial_year_ending)
    is_any_data_present = False

    for financial_month in financial_year_months:
        month, year = financial_month["month"], financial_month["year"]

        site_kpi_object: SiteKPI = get_object_or_none(
            SiteKPI, site_id=site_id, month=month, year=year
        )

        month_stock_volume_response = {
            "stock_volume": None,
        }

        if site_kpi_object:
            is_any_data_present = True

            month_stock_volume_response["stock_volume"] = site_kpi_object.stock_volume

        month_name = calendar.month_abbr[month].lower()
        monthly_stock_volume[month_name] = month_stock_volume_response

    if is_any_data_present:
        return monthly_stock_volume

    return None


def get_safety_index_for_financial_year(site_id: str, financial_year_ending: int):
    monthly_safety_index = {}
    financial_year_months = get_financial_year_months(financial_year_ending)
    is_any_data_present = False

    for financial_month in financial_year_months:
        month, year = financial_month["month"], financial_month["year"]

        site_kpi_object: SiteKPI = get_object_or_none(
            SiteKPI, site_id=site_id, month=month, year=year
        )
        month_safety_index_response = {
            "haul_road_distance_under_gradient_issue": None,
            "haul_road_distance_under_width_issue": None,
        }

        if site_kpi_object:
            is_any_data_present = True

            month_safety_index_response[
                "haul_road_distance_under_gradient_issue"
            ] = site_kpi_object.haul_road_distance_under_gradient_issue
            month_safety_index_response[
                "haul_road_distance_under_width_issue"
            ] = site_kpi_object.haul_road_distance_under_width_issue

        month_name = calendar.month_abbr[month].lower()
        monthly_safety_index[month_name] = month_safety_index_response

    if is_any_data_present:
        return monthly_safety_index

    return None
