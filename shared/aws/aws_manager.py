import json
from datetime import datetime, timezone
from typing import Dict, Generator, List

import boto3
import botocore
from botocore.exceptions import ParamValidationError
from django.utils.text import slugify

from rainbow import logger
from rainbow.env_variables import EnvVariable

from .schemas import JobDetails, JobOutputSchema


class AwsManager:
    s3client = boto3.client("s3")
    batch_client = boto3.client("batch")
    lambda_client = boto3.client("lambda")
    logs_client = boto3.client("logs")
    s3_resource = boto3.resource("s3")

    # S3 helper methods.
    @classmethod
    def upload_file(self, bucket_name: str, key: str, file):
        return self.s3client.put_object(
            Body=file,
            Bucket=bucket_name,
            Key=key,
            StorageClass="STANDARD_IA",
        )

    @classmethod
    def get_upload_signed_url(
        self, bucket_name: str, key: str, upload_id: str, part_number: int
    ):
        return self.s3client.generate_presigned_url(
            ClientMethod="upload_part",
            Params={
                "Bucket": bucket_name,
                "Key": key,
                "UploadId": upload_id,
                "PartNumber": part_number,
            },
        )

    @classmethod
    def multipart_upload(self, bucket_name: str, key: str):
        return self.s3client.create_multipart_upload(
            Bucket=bucket_name,
            Key=key,
            StorageClass="STANDARD_IA",
        )

    @classmethod
    def abort_multipart(self, bucket_name: str, key: str, upload_id: str):
        return self.s3client.abort_multipart_upload(
            Bucket=bucket_name, Key=key, UploadId=upload_id
        )

    @classmethod
    def complete_multipart(
        self, bucket_name: str, key: str, parts: List, upload_id: str
    ):
        return self.s3client.complete_multipart_upload(
            Bucket=bucket_name,
            Key=key,
            MultipartUpload={"Parts": parts},
            UploadId=upload_id,
        )

    @classmethod
    def get_download_signed_url(self, bucket_name: str, key: str, file_name: str):
        return self.s3client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": bucket_name,
                "Key": key,
                "ResponseContentDisposition": 'attachment;filename="' + file_name + '"',
            },
            ExpiresIn=24 * 60 * 60,  # 1 day in seconds (i.e: 86400 seconds).
        )

    @classmethod
    def does_file_exist(
        self,
        bucket_name: str,
        key: str,
    ):
        try:
            head_object = self.s3client.head_object(Bucket=bucket_name, Key=key)
            return bool(head_object)
        except:
            return False

    @classmethod
    def delete_file(
        self,
        bucket_name: str,
        key: str,
    ):
        return self.s3client.delete_object(Bucket=bucket_name, Key=key)

    @classmethod
    def get_object_size(
        self,
        bucket_name: str,
        key: str,
    ):
        head_response = self.s3client.head_object(Bucket=bucket_name, Key=key)
        return head_response["ContentLength"]

    @classmethod
    def put_object_presigned_url(cls, bucket_name, file_path) -> str:
        return cls.s3client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": bucket_name,
                "Key": file_path,
                "StorageClass": EnvVariable.S3_STORAGE_CLASS.value,
            },
        )

    @classmethod
    def get_objects_in_s3_folder(cls, bucket, prefix) -> Generator:
        paginator = cls.s3client.get_paginator("list_objects_v2")
        pages = paginator.paginate(Bucket=bucket, Prefix=prefix)
        try:
            for page in pages:
                for obj in page["Contents"]:
                    yield obj
        # pass incase Contents key was not found that means file was not found in s3 bucket
        except KeyError:
            pass

    @classmethod
    def get_json_object(cls, bucket, prefix) -> dict:
        try:
            return json.loads(
                cls.s3_resource.Object(bucket, prefix)
                .get()["Body"]
                .read()
                .decode("utf-8")
            )
        except Exception as error:
            logger.exception(error)

    @classmethod
    def get_object_key_list(cls, bucket, prefix) -> list[str]:
        key_list = []
        for obj in cls.get_objects_in_s3_folder(bucket, prefix):
            key_list.append(obj["Key"])
        return key_list

    @classmethod
    def get_object(cls, bucket, key):
        s3_object = cls.s3_resource.Object(
            bucket_name=bucket,
            key=key,
        )
        return s3_object

    # Batch Job helper methods.
    @classmethod
    def submit_batch_job(
        self,
        job_definition: str,
        job_queue: str,
        job_name: str,
        environment_variables: List[dict],
    ):
        response: JobOutputSchema = self.batch_client.submit_job(
            jobName=slugify(job_name),
            jobQueue=job_queue,
            jobDefinition=job_definition,
            containerOverrides={
                "environment": environment_variables,
            },
        )
        return response

    @classmethod
    def terminate_batch_job(
        self, job_id: str, reason: str = "Job terminated by user."
    ) -> int:
        """
        This function terminates the batch job with the given job_id and returns the int status code.
        """
        try:
            response = self.batch_client.terminate_job(
                jobId=job_id,
                reason=reason,
            )
            return response["ResponseMetadata"]["HTTPStatusCode"]
        except ParamValidationError as error:
            logger.exception(error)
            return 400
        except Exception as error:
            logger.exception(error)
            return error.response["Error"]["Code"]

    @classmethod
    def invoke_lambda_function(self, function_name: str, payload: Dict) -> int:
        """
        Returns status code.
        """
        try:
            response = self.lambda_client.invoke(
                FunctionName=function_name,
                InvocationType="Event",
                Payload=json.dumps(payload),
            )

            logger.debug(response)
            return response["StatusCode"]
        except botocore.exceptions.ClientError as error:
            logger.exception(error)
            return error.response["Error"]["Code"]

    @classmethod
    def get_job_details(self, job_id: str) -> JobDetails:
        try:
            # Fetch job details.
            job_response = self.batch_client.describe_jobs(jobs=[job_id])
            if not job_response["jobs"]:
                logger.info(f"No jobs found with job_id {job_id}.")
                return None

            job_details = job_response["jobs"][0]

            job_definition_name = job_details.get("jobDefinition")
            job_queue = job_details.get("jobQueue")

            # Fetch job definition details.
            definition_response = self.batch_client.describe_job_definitions(
                jobDefinitions=[job_definition_name]
            )

            job_definitions_details = definition_response["jobDefinitions"][0]

            # Fetch job queue details.
            queue_response = self.batch_client.describe_job_queues(
                jobQueues=[job_queue]
            )

            job_queue_details = queue_response["jobQueues"][0]
            compute_environment_order = job_queue_details.get("computeEnvironmentOrder")

            compute_environment_name = compute_environment_order[0].get(
                "computeEnvironment"
            )

            # Fetch compute environment details.
            environment_response = self.batch_client.describe_compute_environments(
                computeEnvironments=[compute_environment_name]
            )

            compute_environment_details = environment_response["computeEnvironments"][0]
            compute_resources = compute_environment_details.get("computeResources")

            provisioning_model = compute_resources.get("type")

            instance_type = None
            if instance_types := compute_resources.get("instanceTypes", None):
                instance_type = instance_types[0]

            container_properties = job_definitions_details.get("containerProperties")
            resource_requirements = container_properties.get("resourceRequirements", [])

            log_stream_name = job_details["container"].get("logStreamName")

            ram, v_cpus = None, None
            for resource in resource_requirements:
                if resource["type"] == "MEMORY":
                    ram = resource["value"]
                elif resource["type"] == "VCPU":
                    v_cpus = resource["value"]

            aws_started_at_millis = job_details.get("startedAt")
            if aws_started_at_millis is None:
                logger.info(f"Missing start time for job_id {job_id}.")
                return None

            aws_started_at_seconds = aws_started_at_millis / 1000
            job_start_time = datetime.fromtimestamp(
                aws_started_at_seconds, tz=timezone.utc
            )

            job_end_time = datetime.now(timezone.utc)

            job_details: JobDetails = {
                "started_at": job_start_time,
                "stopped_at": job_end_time,
                "log_stream_name": log_stream_name,
                "provisioning_model": provisioning_model,
                "instance_type": instance_type,
                "v_cpus": v_cpus,
                "ram": ram,
            }

            return job_details

        except self.batch_client.exceptions.ClientError as error:
            logger.exception(f"ClientError while describing job {job_id}: {error}")

        except Exception as error:
            logger.exception(
                f"Unexpected error while getting job info for {job_id}: {error}"
            )

    @classmethod
    def get_job_queue(self, job_id) -> str:
        try:
            job_queue = self.batch_client.describe_jobs(jobs=[job_id])["jobs"][0][
                "jobQueue"
            ]
            return job_queue
        except:
            return ""
