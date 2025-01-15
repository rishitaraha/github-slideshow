from enum import Enum


class BaseReference(Enum):
    VisibleGround = "visible_ground"
    SiteBaseDsm = "site_base_dsm"
    OtherIterationDsm = "other_iteration_dsm"

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]


class HeapMaterialTypes(Enum):
    Other = "other"
    Overburden = "overburden"
    Ore = "ore"

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]

    @classmethod
    def for_kpi(cls):
        return [cls.Overburden.value, cls.Ore.value]


class HeapCategory(Enum):
    INCREMENTAL_DUMP_VOLUME = "incremental_dump_volume"
    EXCAVATED_VOLUME = "excavated_volume"
    STOCK_VOLUME = "stock_volume"
    OTHER = "other"

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]


class VolumeReportFormat(Enum):
    PDF = "pdf"
    CSV = "csv"


class SelectedOutputs(Enum):
    BENCH_ANALYSIS = "Bench Analysis - Toe & Crest"
    HAUL_ROAD_GRADIENT = "Haul Road Gradient"
    HAUL_ROAD_WIDTH = "Haul Road Width"
    DRAINAGE_ANALYTICS = "Drainage Analytics"

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]
