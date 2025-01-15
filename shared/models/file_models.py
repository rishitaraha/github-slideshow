import os

from django.contrib.postgres.fields import ArrayField
from django.db import models
from django_softdelete.models import DeletedManager, SoftDeleteManager, SoftDeleteModel
from rest_framework.exceptions import ValidationError

from rainbow.env_variables import EnvVariable

from ..constants import FileError, FileStatus, FileType
from ..exception_handling import ValidationErrors
from .base_models import BaseModel
from .process_models import BatchJob


def get_default_bucket_name():
    return EnvVariable.BUCKET_NAME.value


class FileInfo(BaseModel, SoftDeleteModel):
    name = models.CharField(max_length=250)
    type = models.CharField(max_length=50, choices=FileType.choices(), null=True)
    is_folder = models.BooleanField(default=False)
    bucket_name = models.TextField(default=get_default_bucket_name)
    s3_key = models.CharField(max_length=500, null=True)
    status = models.CharField(max_length=20, choices=FileStatus.choices())
    properties = models.JSONField(null=True)
    org = models.ForeignKey(
        "org_manager.Organisation", on_delete=models.DO_NOTHING, null=True
    )
    created_by = models.ForeignKey(
        "user_manager.CustomUser",
        on_delete=models.DO_NOTHING,
        null=True,
    )
    errors = ArrayField(
        models.SlugField(max_length=100, validators=[FileError.validate_slug]),
        default=list,
    )
    batch_job = models.ForeignKey(
        BatchJob,
        on_delete=models.DO_NOTHING,
        null=True,
    )

    # Managers.
    all_objects = models.Manager()
    objects = SoftDeleteManager()
    deleted_objects = DeletedManager()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def clean(self) -> None:
        if self.org and self.created_by and self.org != self.created_by.org:
            raise ValidationError(
                ValidationErrors.FILE_INFO_ORG_MISMATCH.value,
            )

        return super().clean()

    @property
    def extension(self):
        try:
            _, file_extension = os.path.splitext(self.name)
            return file_extension
        except:
            return None

    @property
    def s3_uri(self):
        return f"{self.bucket_name}/{self.s3_key}"

    @property
    def error_messages(self):
        return [FileError[slug].value for slug in self.errors]


class ImageInfo(BaseModel):
    name = models.CharField(null=True)
    bucket_name = models.TextField(default=get_default_bucket_name)
    image_s3_key = models.CharField(max_length=500, null=True)
    thumbnail_s3_key = models.CharField(max_length=500, null=True)
