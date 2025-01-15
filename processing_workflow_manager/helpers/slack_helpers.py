import json
import logging

import requests

from processing_workflow_manager.models import Task
from rainbow.env_variables import EnvVariable

from ..constants import ProcessingStatus

logger = logging.getLogger(__name__)

# Check the MCLI gitlab MR checklist when there is a change made in this method
def slack_notification_handler(message, task: Task):
    slack_webhook_url = EnvVariable.SLACK_WEBHOOK_URL.value
    if task.status == ProcessingStatus.ERROR.value:
        slack_webhook_url = EnvVariable.SLACK_TASK_NOTIFICATION_WEBHOOK_URL.value

    data = {"text": message}
    headers = {"Content-Type": "application/json"}

    try:
        requests.post(slack_webhook_url, data=json.dumps(data), headers=headers)
    except Exception as slack_notification_exception:
        logger.error(slack_notification_exception)
