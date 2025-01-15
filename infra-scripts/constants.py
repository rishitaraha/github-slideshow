from enum import Enum


class AWS_ACCOUNT_IDS(Enum):
    CIL = "607373074620"
    DEV_UAT = "375718637410"
    PROD = "032405165896"
    TSL = "303236535789"
    TEST = "640171966051"


class AWS_PROFILES(Enum):
    DEV_UAT = "dev"
    PROD = "prod"
    CIL = "cil"
    TEST = "test"


DEV_REPOS = {
    "analytics-engine": "rb-analytics-engine-ecr-dev",
    "api-engine": "rb-api-engine-ecr-dev",
    "cog-gen": "rb-cog-ecr-dev",
    "contour-gen": "lambda-contours-generator-dev",
    "mbtiles-ext": "mbtiles-ecr-dev",
    "s3-to-s3-export": "lambda-s3-to-s3-export-dev",
    "slope-map-gen": "slope-map-generator-dev",
    "tile-server": "tile-server-dev",
    "vector-tile-gen": "vector-tiles-generator-dev",
    "master-server": "cp-master-server-ecr-dev",
    "log-server": "cp-log-service-ecr",
    "metashape-cli": "cp-npl-ecr",
    "exif-extractor": "cp-exif-extractor-ecr-dev",
    "data-archiver": "cp-data-archiver",
}

UAT_REPOS = {
    "analytics-engine": "rb-analytics-engine-ecr-uat",
    "api-engine": "rb-api-engine-ecr-uat",
    "cog-gen": "rb-cog-ecr-uat",
    "contour-gen": "lambda-contours-generator-uat",
    "mbtiles-ext": "mbtiles-ecr-dev",
    "s3-to-s3-export": "lambda-s3-to-s3-export-dev",
    "slope-map-gen": "slope-map-generator-uat",
    "tile-server": "tile-server-ecr-uat",
    "vector-tile-gen": "vector-tiles-generator-uat",
    "master-server": "cp-master-server-ecr-dev",
    "log-server": "cp-log-service-ecr",
    "metashape-cli": "cp-npl-ecr",
    "exif-extractor": "cp-exif-extractor-ecr-dev",
    "data-archiver": "cp-data-archiver",
}
PROD_REPOS = {
    "analytics-engine": "rb-analytics-engine-ecr-prod",
    "api-engine": "rb-api-engine-ecr-prod",
    "cog-gen": "rb-cog-ecr-prod",
    "contour-gen": "lambda-contours-generator-prod",
    "mbtiles-ext": "rb-mb-tiles-ecr-prod",
    "s3-to-s3-export": "lambda-s3-to-s3-export-prod",
    "slope-map-gen": "slope-map-generator-prod",
    "tile-server": "tile-server-ecr-prod",
    "vector-tile-gen": "rb-vector-tiles-generator-ecr-prod",
    "master-server": "cp-master-server-ecr-prod",
    "log-server": "cp-log-service-ecr-prod",
    "metashape-cli": "cp-npl-ecr-prod",
    "exif-extractor": "cp-exif-extractor-ecr-prod",
    "data-archiver": "cp-data-archiver-prod",
}

CIL_REPOS = [
    # "cp-data-archiver-prod",
    # "cp-exif-extractor-ecr-prod",
    # "cp-image-server-ecr-prod",
    # "cp-log-server-ecr-prod",
    # "cp-master-server-ecr-prod",
    # "cp-npl-ecr-prod",
    "rb-contour-lambda-ecr-prod",
    "lambda-s3-to-s3-export-prod",
    "raster-server-ecr-prod",
    "rb-analytics-engine-ecr-prod",
    "rb-api-engine-ecr-prod",
    "rb-cog-ecr-prod",
    "rb-mb-tiles-ecr-prod",
    "rb-vector-tiles-generator-ecr-prod",
    "rb-terrain-server-ecr-prod",
    "rb-terrain-tiles-ecr-prod",
    "rb-vector-server-ecr-prod",
    "rb-slope-map-generator-ecr-prod",
]

TSL_REPOS = [
    "cp-data-archiver-ecr-uat",
    "cp-exif-extractor-ecr-uat",
    "cp-frontend-ecr-uat",
    "cp-image-server-ecr-uat",
    "cp-log-server-ecr-uat",
    "cp-master-ecr-uat",
    "cp-metashape-ecr-uat",
    "rb-contour-ecr-uat",
    "rb-s3-to-s3-copy-uat",
    "rb-raster-server-ecr-uat",
    "rb-analytics-engine-ecr-uat",
    "rb-api-engine-ecr-uat",
    "rb-cog-generator-ecr-uat",
    "rb-cron-server-ecr-uat",
    "rb-mb-tiles-ecr-uat",
    "rb-vector-tiles-ecr-uat",
    "rb-terrain-server-ecr-uat",
    "rb-terrain-tiles-ecr-uat",
    "rb-vector-server-ecr-uat",
]

services = {
    "analytics-engine": True,
    "api-engine": True,
    "cog-gen": True,
    "contour-gen": True,
    "s3-to-s3-export": True,
    "slope-map-gen": True,
    "tile-server": True,
    "vector-tile-gen": True,
    "master-server": True,
    "log-server": True,
    "metashape-cli": True,
    "exif-extractor": True,
    "data-archiver": True,
}

TEST_REPOS = {
    "analytics-engine": "ac-analytics-engine-ecr-dev",
    "api-engine": "ac-api-engine-ecr-dev",
    "cog-gen": "ac-cog-ecr-dev",
    "contour-gen": "ac-contour-generator-ecr-dev",
    "mbtiles-ext": "ac-mbtiles-ecr-dev",
    "s3-to-s3-export": "ac-s3-to-s3-export-ecr-dev",
    "slope-map-gen": "ac-slope-map-ecr-dev",
    "tile-server": "ac-tile-server-ecr-dev",
    "vector-tile-gen": "ac-vector-tiles-ecr-dev",
    "master-server": "ac-master-server-ecr-dev",
    "log-server": "ac-log-server-ecr-dev",
    "metashape-cli": "ac-metashapecli-ecr-dev",
    "exif-extractor": "ac-exif-extractor-ecr-dev",
    "data-archiver": "ac-data-archiver-ecr-dev",
}
