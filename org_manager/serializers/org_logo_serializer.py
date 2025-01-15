from django.core.validators import FileExtensionValidator
from rest_framework import serializers

from shared.constants import FileStatus, FileType
from shared.helpers import create_s3_file_key, resize_image, upload_file
from shared.models import FileInfo

from ..models import Organisation


class UploadLogoSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(validators=[FileExtensionValidator(["jpeg", "jpg"])])

    class Meta:
        model = Organisation
        fields = ["logo"]

    def update(self, org: Organisation, validated_data):
        # Resizing image.
        logo_output_size = (300, 300)
        logo = resize_image(validated_data["logo"], logo_output_size)

        logo_s3_key = create_s3_file_key(FileType.ORG_LOGO.value, f"{org.id}.jpeg")

        logo_file_info = org.logo or FileInfo(s3_key=logo_s3_key)
        logo_file_info.name = str(validated_data["logo"])
        logo_file_info.status = FileStatus.STARTED.value
        logo_file_info.type = FileType.ORG_LOGO.value
        logo_file_info.save()

        upload_file(logo_file_info, logo)

        if not org.logo:
            org.logo = logo_file_info
            org.save(update_fields=["logo"])

        return org
