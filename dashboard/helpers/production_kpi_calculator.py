import calendar

from shared.helpers import get_financial_year_months, get_object_or_none
from site_manager.models import SiteKPI


def calculate_site_production_for_financial_year(
    site_id: str, financial_year_ending: int
):
    monthly_production = {}
    financial_year_months = get_financial_year_months(financial_year_ending)
    is_any_data_present = False

    for financial_month in financial_year_months:
        month, year = financial_month["month"], financial_month["year"]

        production_of_month = {
            "target_overburden_production": None,
            "target_ore_production": None,
            "target_composite_volume": None,
            "target_stripping_ratio": None,
            "actual_overburden_production": None,
            "actual_ore_production": None,
            "actual_composite_volume": None,
            "actual_stripping_ratio": None,
        }

        # Fetch target production of month.
        site_kpi: SiteKPI = get_object_or_none(
            SiteKPI, site_id=site_id, month=month, year=year
        )

        if site_kpi:
            is_any_data_present = True

            # Target overburden production.
            production_of_month[
                "target_overburden_production"
            ] = site_kpi.target_overburden_production

            # Target ore production.
            production_of_month[
                "target_ore_production"
            ] = site_kpi.target_ore_production

            if site_kpi.target_ore_production and site_kpi.target_overburden_production:
                # Target composite volume.
                production_of_month["target_composite_volume"] = (
                    site_kpi.target_ore_production
                    + site_kpi.target_overburden_production
                )

                # Target stripping ratio.
                if site_kpi.target_ore_production != 0:
                    production_of_month["target_stripping_ratio"] = (
                        site_kpi.target_overburden_production
                        / site_kpi.target_ore_production
                    )

            # Actual overburden production.
            production_of_month[
                "actual_overburden_production"
            ] = site_kpi.actual_overburden_production

            # Actual ore production.
            production_of_month[
                "actual_ore_production"
            ] = site_kpi.actual_ore_production

            if site_kpi.actual_ore_production and site_kpi.actual_overburden_production:
                # Actual composite volume.
                production_of_month["actual_composite_volume"] = (
                    site_kpi.actual_ore_production
                    + site_kpi.actual_overburden_production
                )

                # Actual stripping ratio.
                if site_kpi.actual_ore_production != 0:
                    production_of_month["actual_stripping_ratio"] = (
                        site_kpi.actual_overburden_production
                        / site_kpi.actual_ore_production
                    )

        month_name = calendar.month_abbr[financial_month["month"]].lower()
        monthly_production[month_name] = production_of_month

    # We will only return monthly production if there is data for at least one month. Otherwise, we will return None.
    if is_any_data_present:
        return monthly_production
