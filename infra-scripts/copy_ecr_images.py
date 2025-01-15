import os
from dataclasses import dataclass
from typing import Dict, List

from constants import AWS_PROFILES, PROD_REPOS, CIL_REPOS, TEST_REPOS, AWS_ACCOUNT_IDS


# Data classes
@dataclass
class ECRInfo:
    repos: Dict
    account_id: AWS_ACCOUNT_IDS
    profile: AWS_PROFILES


# ECR Copy Loop.
def copy_ecr_images(
    services: Dict,
    source: ECRInfo,
    destination: ECRInfo,
):
    for service in services.keys():
        if services[service] == True:
            try:
                source_image_uri = f"{source.account_id.value}.dkr.ecr.ap-south-1.amazonaws.com/{source.repos[service]}:latest"
                destination_image_uri = f"{destination.account_id.value}.dkr.ecr.ap-south-1.amazonaws.com/{destination.repos[service]}:latest"

                os.system(
                    f"aws ecr get-login-password --region ap-south-1 --profile {source.profile.value} | docker login --username AWS --password-stdin {source.account_id.value}.dkr.ecr.ap-south-1.amazonaws.com"
                )

                os.system(f"docker pull {source_image_uri}")
                os.system(f"docker tag {source_image_uri} {destination_image_uri}")
                os.system(
                    f"aws ecr get-login-password --region ap-south-1 --profile {destination.profile.value} | docker login --username AWS --password-stdin {destination.account_id.value}.dkr.ecr.ap-south-1.amazonaws.com"
                )
                os.system(f"docker push {destination_image_uri}")

                print(f"Copied image {source_image_uri} to {destination_image_uri}")
            except Exception as e:
                exit(1)


if __name__ == "__main__":
    # Copy ECR Images PROD to CIL
    # copy_ecr_images(
    #     ECRInfo(PROD_REPOS, AWS_PROFILES.PROD), ECRInfo(CIL_REPOS, AWS_PROFILES.CIL)
    # )

    services_to_copy = {
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
        "data-archiver": True
    }

    # Copy CIL ECR Images
    copy_ecr_images(
        services_to_copy,
        source=ECRInfo(PROD_REPOS, AWS_ACCOUNT_IDS.PROD, AWS_PROFILES.PROD),
        destination=ECRInfo(TEST_REPOS, AWS_ACCOUNT_IDS.TEST, AWS_PROFILES.TEST),
    )
