from datetime import date
from typing import List

from .schemas import FinancialYearMonthSchema, FinancialYearSchema


def get_financial_year_months(
    financial_year_end: int,
) -> List[FinancialYearMonthSchema]:
    """
    Returns a list of dicts with years and months in that financial year.
    For Example: for financial_year_end = 2023 it will return
        [{'year': 2022, 'month': 4}, {'year': 2022, 'month': 5}, {'year': 2022, 'month': 6}, {'year': 2022, 'month': 7}, {'year': 2022, 'month': 8}, {'year': 2022, 'month': 9}, {'year': 2022, 'month': 10}, {'year': 2022, 'month': 11}, {'year': 2022, 'month': 12}, {'year': 2023, 'month': 1}, {'year': 2023, 'month': 2}, {'year': 2023, 'month': 3}]

    """

    year_months = []
    for month in range(4, 13):
        year_months.append({"year": financial_year_end - 1, "month": month})
    for month in range(1, 4):
        year_months.append({"year": financial_year_end, "month": month})
    return year_months


def get_financial_year(date: date) -> FinancialYearSchema:
    """
    Returns the financial year in which the given date falls.
    """

    starting_month = 4  # April
    start_year = date.year - 1 if date.month < starting_month else date.year
    end_year = start_year + 1
    return {"start_year": start_year, "end_year": end_year}
