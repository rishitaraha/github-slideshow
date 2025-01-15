import os
from enum import Enum

from src.core import DockerImage

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
ECR_REPOSITORY = f"375718637410.dkr.ecr.{AWS_REGION}.amazonaws.com"


class DSDockerImage(Enum):
    HRA = DockerImage(
        repository_uri=ECR_REPOSITORY,
        image_name="data-science/mine-analytics",
        tag="v1.3.8",
    )
    RURAL_DETECTION = DockerImage(
        repository_uri=ECR_REPOSITORY,
        image_name="data-science/deep-learning-analytics",
        tag="v1.1.3",
    )
    DRAINAGE_ANALYSIS = DockerImage(
        repository_uri=ECR_REPOSITORY,
        image_name="data-science/mine-analytics",
        tag="v1.2.2",
    )
    HEAP_BOUNDARY_DETECTION = DockerImage(
        repository_uri=ECR_REPOSITORY,
        image_name="data-science/mine-analytics",
        tag="v1.3.2",
    )
    TREE_CANOPY_DETECTION = DockerImage(
        repository_uri=ECR_REPOSITORY,
        image_name="data-science/deep-learning-analytics",
        tag="v1.1.3",
    )
    BENCH_CREST_TOE_DETECTION = DockerImage(
        repository_uri=ECR_REPOSITORY,
        image_name="data-science/mine-analytics",
        tag="v1.1.1",
    )


class FolderPaths(Enum):
    DOCKER_INPUTS_FOLDER = "/code/files/inputs"
    DOCKER_OUTPUTS_FOLDER = "/code/files/outputs"
    RESULTS_FOLDER = "/code/files/results"
    INPUTS_FOLDER = "/code/files/inputs"
    TEMP_DIR = "/tmp"
