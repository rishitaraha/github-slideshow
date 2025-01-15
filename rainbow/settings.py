import logging
import os
import sys
from datetime import timedelta
from pathlib import Path

import sentry_sdk
from corsheaders.defaults import default_headers
from sentry_sdk.integrations.django import DjangoIntegration

from .env_variables import EnvVariable

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = EnvVariable.SECRET_KEY.value

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True if EnvVariable.DEBUG.value == "1" else False

ALLOWED_HOSTS = ["*"]

# Ref: https://docs.djangoproject.com/en/5.0/ref/settings/#std-setting-CSRF_TRUSTED_ORIGINS
CSRF_TRUSTED_ORIGINS = (
    EnvVariable.CSRF_TRUSTED_ORIGINS.value.split(",")
    if EnvVariable.CSRF_TRUSTED_ORIGINS.value
    else []
)

INSTALLED_APPS = [
    "whitenoise.runserver_nostatic",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    # Dependencies.
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "fieldsignals",
    "sequences",
    # Apps.
    "shared.apps.SharedConfig",
    "dashboard.apps.DashboardConfig",
    "org_manager.apps.OrgManagerConfig",
    "user_manager.apps.UserManagerConfig",
    "auth_manager.apps.AuthManagerConfig",
    "project_manager.apps.ProjectManagerConfig",
    "site_manager.apps.SiteManagerConfig",
    "iteration_manager.apps.IterationManagerConfig",
    "layer_manager.apps.LayerManagerConfig",
    "processing_manager.apps.ProcessingManagerConfig",
    "analytics_engine_manager.apps.AnalyticsEngineManagerConfig",
    "processing_workflow_manager.apps.ProcessingWorkflowManagerConfig",
    "workspace_manager.apps.WorkspaceManagerConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "csp.middleware.CSPMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "rainbow.middleware.custom_headers.CustomHeadersMiddleware",
    "rainbow.middleware.logging.LoggingMiddleware",
    "rainbow.middleware.request.RequestInterceptor",
]

ROOT_URLCONF = "rainbow.urls"
AUTH_USER_MODEL = "user_manager.CustomUser"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "rainbow.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": EnvVariable.DB_NAME.value,
        "USER": EnvVariable.DB_USERNAME.value,
        "PASSWORD": EnvVariable.DB_PASSWORD.value,
        "HOST": EnvVariable.DB_HOSTNAME.value,
        "PORT": EnvVariable.DB_PORT.value,
    },
    "default_with_migration_rights": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": EnvVariable.DB_NAME.value,
        "USER": EnvVariable.DB_MIGRATE_USERNAME.value,
        "PASSWORD": EnvVariable.DB_MIGRATE_PASSWORD.value,
        "HOST": EnvVariable.DB_HOSTNAME.value,
        "PORT": EnvVariable.DB_PORT.value,
    },
}

# Auth Configs.
AUTHENTICATION_BACKENDS = [
    "auth_manager.backends.CaseInsensitiveAuthBackend",
    "django.contrib.auth.backends.ModelBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
    {
        "NAME": "user_manager.validators.UppercaseValidator",
    },
    {
        "NAME": "user_manager.validators.LowercaseValidator",
    },
    {
        "NAME": "user_manager.validators.SpecialCharValidator",
    },
]

# Datetime and language configs.
LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

# Static files configs.
STATIC_URL = "static/"

STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "docs", "openapi"),
    os.path.join(BASE_DIR, "assets", "public"),
]
# Note: Using CDN or S3 is a best way to serve static file in high traffic. In our case traffic is not high as for now so we can serve files from main server.
# TODO: Use s3 if traffic increase for static files in future.
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Rest framework setup.
REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "rainbow.exceptions.handler.custom_exception_handler",
    "DEFAULT_RENDERER_CLASSES": ["rainbow.response_renderer.CustomJsonRender"],
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
}

# CORS.
if DEBUG:
    CORS_ORIGIN_ALLOW_ALL = True
else:
    CORS_ALLOWED_ORIGINS = EnvVariable.ALLOWED_CORS_DOMAINS.value.split(",")

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_ALLOW_HEADERS = [
    *default_headers,
    "x-request-id",
    "X-Org-Access-Token",
]

# Security Headers.
SECURE_HSTS_SECONDS = 3600
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
CSP_REPORT_ONLY = True
CSP_REPORT_URI = EnvVariable.SENTRY_SECURITY_URI.value


# Email configs.
EMAIL_HOST_USER = EnvVariable.EMAIL_HOST_USER.value
EMAIL_HOST_PASSWORD = EnvVariable.EMAIL_HOST_PASSWORD.value
EMAIL_USE_SSL = False
EMAIL_USE_TLS = True
EMAIL_PORT = 587
EMAIL_HOST = "smtp.office365.com"


# File size limit for upload.
# Ref: https://stackoverflow.com/questions/60429218/django-file-upload-max-memory-vs-data-upload-max-memory
FILE_UPLOAD_MAX_MEMORY_SIZE = 500 * 1024 * 1024  # 500 Mb limit
DATA_UPLOAD_MAX_MEMORY_SIZE = 500 * 1024 * 1024  # 500 Mb limit

#  Sentry Setup
if EnvVariable.ENVIRONMENT.value in ["production", "uat"]:
    sentry_sdk.init(
        dsn=EnvVariable.SENTRY_DSN.value,
        integrations=[DjangoIntegration()],
        send_default_pii=True,
        environment=EnvVariable.ENVIRONMENT.value,
    )

# Disable logging for tests.
if len(sys.argv) > 1 and sys.argv[1] == "test":
    logging.disable(logging.CRITICAL)
