from rest_framework import status
from rest_framework.exceptions import APIException


class MicroserviceException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST


class GeneralException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST


class AuthException(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED


class DSMNotFoundException(APIException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY


class FileUploadFailedException(APIException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY


class S3DownloadException(APIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
