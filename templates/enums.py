from enum import Enum


class EmailTemplatePath(Enum):
    ANALYTICS_REQUEST = "emails/analytics_request_email.html"
    DATASET_PROCESSING = "emails/dataset_processing_email.html"
    TASK_STATUS = "emails/task_status_update_email.html"
