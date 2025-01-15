from shared.constants import BaseEnum


class ProcessingStatus(BaseEnum):
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    ERROR = "error"
    PENDING = "pending"
    PROCESSING = "processing"


FINAL_PROCESSING_STATUSES = [
    ProcessingStatus.CANCELLED.value,
    ProcessingStatus.COMPLETED.value,
    ProcessingStatus.ERROR.value,
]


class FileUploadStatus(BaseEnum):
    DONE = "done"
    FAILED = "failed"
    STARTED = "started"
