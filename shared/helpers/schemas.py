from typing import TypedDict


class FinancialYearMonthSchema(TypedDict):
    year: int
    month: int


class FinancialYearSchema(TypedDict):
    start_year: int
    end_year: int
