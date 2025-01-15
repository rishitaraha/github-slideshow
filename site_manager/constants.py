from enum import Enum


class SiteType(Enum):
    MINE_SITE = "mine_site"
    WAGON_SITE = "wagon_site"
    CRUSHED_SITE = "crushed_site"
    UNCRUSHED_SITE = "uncrushed_site"
    URBAN_LAND = "urban_land"

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]


class NumberOfCSVFields(Enum):
    STOCK_VOLUME_KPI = 3
    SAFETY_INDEX_KPI = 4
    PRODUCTION_KPI = 6


class KpiType(Enum):
    PRODUCTION = "production"
    SAFETY_INDEX = "safety_index"
    STOCK_VOLUME = "stock_volume"

    @classmethod
    def values(cls):
        return [key.value for key in cls]


class AccessType(Enum):
    BASIC = "basic"
    ADVANCE = "advance"

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]

    @classmethod
    def values(cls):
        return [key.value for key in cls]
