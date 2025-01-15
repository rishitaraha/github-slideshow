import zipfile
from io import BytesIO
from uuid import uuid4

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import status

from shared.constants import BatchJobStatus


class MockedS3Client:
    def generate_presigned_url(self, *args, **kwargs):
        return "presigned_url"


class MockedAwsManager:
    s3client = MockedS3Client()

    @classmethod
    def get_upload_signed_url(self):
        return "presigned_url"

    @classmethod
    def multipart_upload(self):
        return {"UploadId": "upload_id"}

    @classmethod
    def abort_multipart(self):
        return True

    @classmethod
    def complete_multipart(self):
        return True

    @classmethod
    def get_download_signed_url(self):
        return "download_url"

    @classmethod
    def delete_file(self):
        return True

    @classmethod
    def upload_file(self):
        return True

    @classmethod
    def invoke_lambda_function(self):
        return status.HTTP_202_ACCEPTED

    @classmethod
    def submit_batch_job(self):
        return {
            "jobArn": "Amazon-Resource-Name",
            "jobName": "Job-Name",
            "jobId": uuid4(),
        }

    @classmethod
    def terminate_batch_job(self):
        return 200


def create_test_image(
    filename="test_image",
    size=(100, 100),
    image_mode="RGB",
    image_format="JPEG",
):
    """
    Generating a image for test
    """
    data = BytesIO()
    Image.new(image_mode, size).save(data, image_format)
    image = SimpleUploadedFile(f"{filename}.{image_format.lower()}", data.getvalue())
    return image


def create_test_zipfile():
    # Create an in-memory buffer to write the zip file to
    buffer = BytesIO()

    # Write some data to the zip file
    with zipfile.ZipFile(buffer, "w") as zip_file:
        zip_file.writestr("file1.txt", "Hello, World!")
        zip_file.writestr("file2.txt", "Goodbye, World!")

    # Reset the buffer position to the beginning
    buffer.seek(0)

    # Return the contents of the buffer as a bytes object
    return buffer.getvalue()


def mock_generator():
    return (i for i in range(5))


def mock_batch_job_instance():
    from shared.models import BatchJob

    return BatchJob.objects.create(
        job_id=uuid4(),
        status=BatchJobStatus.STARTED.value,
        env_variables=[],
    )
