import json
import logging
import os

import pytz
from django.urls import reverse

from processing_workflow_manager.constants import (
    EmailSubjectTaskStatus,
    ProcessingStatus,
    TaskStage,
)
from shared.helpers.email_helper import send_email
from user_manager.constants import UserType
from user_manager.models import CustomUser

from ..models import Task

logger = logging.getLogger(__name__)


def trigger_mail_for_task_status_update(task: Task):
    try:
        context_data = {}
        if task.iteration_dataset:
            parent_dataset = task.iteration_dataset
            context_data["iteration_name"] = parent_dataset.iteration.name
        elif task.merged_dataset:
            parent_dataset = task.merged_dataset
            context_data["merged_dataset_name"] = parent_dataset.name

        parent_dataset_name = parent_dataset.name
        organization = parent_dataset.site.project.org
        site = parent_dataset.site
        site_name = site.name
        site_id = site.id
        project_name = site.project.name

        recipient_list = list(
            CustomUser.objects.filter(
                org=organization, type=UserType.SUPPORT.value
            ).values_list("email", flat=True)
        )
        if task.created_by:
            task_created_by_email = task.created_by.email
            task_created_by = task.created_by.name
            # In case org admin has created the task, to avoid appending email twice in list.
            if task_created_by_email not in recipient_list:
                recipient_list.append(task.created_by.email)
        else:
            task_created_by = "N/A"

        if not recipient_list:
            logger.info(f"No email recipients found for task {task.id} info")
            return
        task_status = (
            EmailSubjectTaskStatus.TASK_COMPLETED.value
            if task.status == ProcessingStatus.COMPLETED.value
            else EmailSubjectTaskStatus.TASK_FAILED.value
        )
        end_stage = task.end_stage
        options_json = json.loads(task.options)
        optimization_options = options_json.get("optimization-options", {})
        stop_after_reoptimize = optimization_options.get("stop-after-reoptimize")
        if stop_after_reoptimize:
            end_stage = f"{TaskStage.ALIGN_PHOTOS.value} -> {TaskStage.STOP_AT_REOPTIMIZATION.value}"

        task_name = task.name
        subject = f"{task_status} - {task_name}, {parent_dataset_name}, {site_name}"
        stage = end_stage
        ist_timezone = pytz.timezone("Asia/Kolkata")
        task_created_at_utc = task.created_at
        task_created_at_ist = task_created_at_utc.astimezone(ist_timezone)
        template_filename = "task_update.html"

        if task.batch_job_details:
            context_data["time_taken"] = task.batch_job_details.time_taken

        context_data = {
            "project_name": project_name,
            "site_name": site_name,
            "site_link": f"{os.environ['PIPELINE_UI_URL']}{reverse('site_view', args=[site_id])}",
            "task_name": task_name,
            "task_created_at": task_created_at_ist,
            "stage": stage,
            "task_created_by": task_created_by,
            **context_data,
        }

        is_email_sent = send_email(
            subject=subject,
            recipient_list=recipient_list,
            template_context=context_data,
            template_filename=template_filename,
        )
        if is_email_sent:
            logger.info(
                f"email_sent_successfully_to: {recipient_list} , for_task_id: {task.id}"
            )
    except Exception as e:
        logger.error(f"Failed to trigger email {str(e)}")
