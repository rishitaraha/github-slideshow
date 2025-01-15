from enum import Enum
from uuid import uuid4


class FileInfoSignalUID(Enum):
    COG_METADATA_EXTRACTOR = str(uuid4())
    TERMINATE_BATCH_JOB_ON_DELETE = str(uuid4())
    FETCH_BATCH_JOB_DETAILS = str(uuid4())


class BatchJobSignalUID(Enum):
    FETCH_BATCH_JOB_DETAILS = str(uuid4())
    TERMINATE_BATCH_JOB_ON_DELETE = str(uuid4())
