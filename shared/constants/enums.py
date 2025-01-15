from enum import Enum


class BaseEnum(Enum):
    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]

    @classmethod
    def values(cls):
        return (key.value for key in cls)


class Status(BaseEnum):
    IMPORTING = "importing"
    IMPORT_FAILED = "import_failed"
    STARTED = "started"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"
    PENDING = "pending"
