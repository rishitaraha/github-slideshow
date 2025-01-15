import os

from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from org_manager.permissions import IsFeatureFlagEnabled
from rainbow.env_variables import EnvVariable
from rainbow.log_config import init_logger
from shared.aws import AwsManager, S3File
from shared.exception_handling import ApiErrors, ValidationErrors

from ..constants import FileUploadStatus
from ..helpers import (
    check_image_exif,
    submit_exif_extractor_job,
    validate_image_filename,
)
from ..models import GeotagImage, ProcessingIterationData
from ..serializers import IterationDatasetUpdateSerializer

logger = init_logger(__name__)


class ImagesUploadViewSet(ViewSet):
    permission_classes = [IsFeatureFlagEnabled]

    @action(
        detail=True,
        methods=["get"],
        url_path="images-list",
        url_name="uploaded-images-list",
    )
    def list_uploaded_images(self, request, pk):
        """
        Responds with the list of images successfully uploaded to S3.
        """
        iteration_dataset = get_object_or_404(ProcessingIterationData, id=pk)
        self.check_object_permissions(request, iteration_dataset.iteration)

        filenames = list(
            GeotagImage.objects.filter(
                iteration_dataset_id=pk, is_image_available=True
            ).values_list("filename", flat=True)
        )

        return Response(
            {
                "message": "Uploaded Image list fetched successfully",
                "data": {"filenames": filenames},
            }
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="images-presigned-url",
        url_name="images-presigned-url",
    )
    def upload_image_presigned_url(self, request, pk):
        """
        Responds list of presigned urls for uploading the image files to S3.
        """

        iteration_dataset = get_object_or_404(
            ProcessingIterationData.objects.select_related(
                "iteration", "image_folder_path"
            ),
            id=pk,
        )
        self.check_object_permissions(request, iteration_dataset.iteration)
        images_filenames = request.data.get("filenames")
        if not images_filenames:
            return ValidationError(ValidationErrors.NO_IMAGE_FILENAMES_PROVIDED.value)

        if not iteration_dataset.image_folder_path:
            raise ValidationError(
                ValidationErrors.ITERATION_IMAGE_FOLDER_DOES_NOT_EXISTS.value
            )

        presigned_urls = []
        for filename in images_filenames:
            validate_image_filename(filename)
            image_file_path = iteration_dataset.image_folder_path.s3_key + filename
            presigned_urls.append(
                AwsManager.put_object_presigned_url(
                    EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
                    image_file_path,
                )
            )

        return Response(
            {
                "message": "Uploaded Image list fetched successfully",
                "data": {"presigned_urls": presigned_urls},
            }
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="image-upload-success",
        url_name="image-upload-success",
    )
    def upload_image_success(self, request, pk):
        """
        Accepts the image upload success status from frontend and auto-increments the image count.
        """
        iteration_dataset = get_object_or_404(
            ProcessingIterationData.objects.select_related(
                "iteration", "image_folder_path"
            ),
            id=pk,
        )
        image_filename = request.data.get("image_filename")
        image_object_key = os.path.join(
            iteration_dataset.image_folder_path.s3_key, image_filename
        )

        if not AwsManager.does_file_exist(
            bucket_name=EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
            key=image_object_key,
        ):
            raise NotFound(ApiErrors.IMAGE_FILE_DOES_NOT_EXISTS_IN_S3.value)

        GeotagImage.objects.update_or_create(
            iteration_dataset=iteration_dataset,
            filename=image_filename,
            defaults={"is_image_available": True},
        )
        number_of_images_uploaded = (
            iteration_dataset.number_of_images
            if iteration_dataset.number_of_images
            else 0
        )
        update_serializer = IterationDatasetUpdateSerializer(
            iteration_dataset,
            data={"number_of_images": number_of_images_uploaded + 1},
            partial=True,
        )
        update_serializer.is_valid(raise_exception=True)
        update_serializer.save()

        return Response({"message": f"image_added_successfully: {image_filename}"})

    @action(
        detail=True,
        methods=["post"],
        url_path="images-upload-complete",
        url_name="images-upload-complete",
    )
    def images_upload_complete(self, request, pk):
        """
        Accepts the image upload success status from frontend and submits exif extraction job.
        """
        iteration_dataset = get_object_or_404(
            ProcessingIterationData.objects.select_related(
                "iteration", "image_folder_path"
            ),
            id=pk,
        )
        self.check_object_permissions(request, iteration_dataset.iteration)

        if (
            request.data["upload_status"] != FileUploadStatus.DONE.value
            or not iteration_dataset.image_folder_path
        ):
            raise ValidationError(ValidationErrors.FILE_UPLOAD_FAILED.value)

        images_count = GeotagImage.objects.get_images_counts(
            iteration_dataset=iteration_dataset
        )
        update_serializer = IterationDatasetUpdateSerializer(
            iteration_dataset,
            data={
                "number_of_images": images_count["total_images"],
                "number_of_images_enabled": images_count["enabled_images"],
            },
            partial=True,
        )
        update_serializer.is_valid(raise_exception=True)
        update_serializer.save()

        logger.info(
            f"Updated count of images in iteration dataset to {iteration_dataset.number_of_images}"
        )

        sample_image_obj = next(
            AwsManager.get_objects_in_s3_folder(
                bucket=EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
                prefix=iteration_dataset.image_folder_path.s3_key,
            )
        )
        logger.info(f"S3Object to check for presence of exif: {sample_image_obj}")

        if not iteration_dataset.are_geotags_present:
            logger.info(
                f"Checking for presence of EXIF in images of iteration-dataset: {str(iteration_dataset.id)} as geotags are not uploaded."
            )
            image_file = S3File(sample_image_obj)

            if check_image_exif(image_file):
                iteration_id = str(iteration_dataset.iteration.id)
                exif_extractor_job_id = submit_exif_extractor_job(
                    task_name="exif_extraction_" + iteration_id,
                    iteration_id=iteration_id,
                    source_image_path=iteration_dataset.image_folder_path.s3_key,
                )
                update_serializer = IterationDatasetUpdateSerializer(
                    iteration_dataset,
                    data={
                        "is_preparing_geotags": True,
                        "exif_extractor_job_id": exif_extractor_job_id.id,
                    },
                    partial=True,
                )
                update_serializer.is_valid(raise_exception=True)
                update_serializer.save()

        data = {"message": "geotag_images_upload_complete"}
        return Response(data)
