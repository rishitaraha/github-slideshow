import re
from datetime import datetime

from itsdangerous import SignatureExpired, URLSafeTimedSerializer
from rest_framework.exceptions import ValidationError
from stream_zip import ZIP_64

from rainbow.env_variables import EnvVariable
from shared.aws.aws_manager import AwsManager
from shared.exception_handling import ApiErrors, GeneralException, ValidationErrors

SECRET_KEY = EnvVariable.SECRET_KEY.value


def validate_image_filename(filename: str):
    image_file_extension_regex = r"(.*?).(jpg|jpeg|png|JPG|JPEG|PNG)$"
    if re.match(image_file_extension_regex, filename) is None:
        raise ValidationError(ValidationErrors.INVALID_FILE_TYPE_PROVIDED.value)


def generate_signed_token(image_folder_path, zip_filename):
    data = {"image_folder_path": image_folder_path, "zip_filename": zip_filename}
    auth_serializer = URLSafeTimedSerializer(SECRET_KEY)
    signed_token = auth_serializer.dumps(data)
    return signed_token


def unsign_token(token):

    try:
        auth_serializer = URLSafeTimedSerializer(SECRET_KEY)
        unsigned_token = auth_serializer.loads(token, max_age=60)
        return unsigned_token
    except SignatureExpired:
        raise ValidationError(ValidationErrors.SIGNATURE_EXPIRED.value)
    except Exception:
        raise GeneralException(ApiErrors.INVALID_SIGNED_TOKEN.value)


async def iterable_to_generator(iterable):
    for element in iterable:
        yield element


async def unzipped_files(keys, s3_resource):
    async for key in iterable_to_generator(keys):

        s3_object = AwsManager.get_object(
            bucket=EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value, key=key
        )

        async def file_data():
            yield s3_object.get()["Body"].read()

        yield key.split("/")[-1], datetime.now(), 0o600, ZIP_64, file_data()
