from processing_workflow_manager.models import Task
from rainbow.env_variables import EnvVariable
from shared.aws.aws_manager import AwsManager
from shared.constants.aws_enums import AWS_REGION_NAME


def generate_slack_message_for_task(task: Task):

    task_name = f"Task Name: {task.name}"
    task_id = f"Task Id: {str(task.id)}"
    status = f"Status: {task.status}"

    time_taken = f"Time Taken: {task.batch_job_details.time_taken}"

    number_of_images = 0
    parent_name = ""
    org_name = ""
    project_name = ""
    site_name = ""
    site_link = ""
    if task.iteration_dataset:
        parent_name = f"Iteration: {task.iteration_dataset.iteration.name}"
        no_of_images = (
            task.taskgeotagimages.all()
            .filter(is_image_available=True, is_image_disabled=False)
            .count()
        )
        number_of_images = f"Number of Images: {str(no_of_images)}"
        org_name = (
            f"Organization: {task.iteration_dataset.iteration.site.project.org.name}"
        )
        project_name = f"Project: {task.iteration_dataset.iteration.site.project.name}"
        site_name = f"Site: {task.iteration_dataset.iteration.site.name}"
        site_link = f"{EnvVariable.ANALYTICS_ENGINE_URL.value}/tasks?iterationd={task.iteration_dataset.iteration.id}"
    elif task.merged_dataset:
        parent_name = f"Merged Dataset: {task.merged_dataset.name}"
        no_of_images = task.merged_dataset.number_of_images
        number_of_images = f"Number of Images: {str(no_of_images)}"
        org_name = f"Organization: {task.merged_dataset.site.project.org.name}"
        project_name = f"Project: {task.merged_dataset.site.project.name}"
        site_name = f"Site: {task.merged_dataset.site.name}"
        # TODO: Update this when merged dataset is implemented
        # site_link = f"{EnvVariable.PIPELINE_UI_URL.value}/sites/{task.merged_dataset.site.id}"

    site_details = f"Site Link: {site_link}"

    created_by_user_name = ""
    created_by_user_email = ""
    created_by_user = task.created_by
    if created_by_user:
        created_by_user_name = f"User Name: {created_by_user.name}"
        created_by_user_email = f"User Email: {str(created_by_user.email)}"

    instance_name = f"Instance Name: {task.batch_job_details.instance_type}"

    task_batch_job_id = task.batch_job_details.job_id
    job_queue_name = AwsManager.get_job_queue(job_id=task_batch_job_id)
    job_queue = f"Job Queue: {job_queue_name}"

    debug_logs_link = f"Debug Logs Link: https://{AWS_REGION_NAME}.console.aws.amazon.com/cloudwatch/home?region={AWS_REGION_NAME}#logsV2:log-groups/log-group/$252Faws$252Fbatch$252Fjob/log-events/{str(task.id)}"

    separator = "___________________________________________________________________________________________________________________"

    message_details = [
        task_name,
        number_of_images,
        status,
        task_id,
        parent_name,
        org_name,
        project_name,
        site_name,
        site_details,
        created_by_user_name,
        created_by_user_email,
        instance_name,
        job_queue,
        debug_logs_link,
        separator,
    ]

    if time_taken:
        message_details.insert(3, time_taken)

    slack_message = "\n".join(message_details)

    return slack_message
