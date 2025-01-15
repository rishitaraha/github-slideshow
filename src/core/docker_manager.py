import base64
import os
from typing import Dict, List, Optional, Union

import boto3
from docker import from_env as get_docker_client_from_env
from docker.client import DockerClient
from docker.models.containers import Container
from docker.models.images import Image

from src.shared import logger
from src.shared.constants import EnvVariable


class DockerImage:
    """
    Represents a Docker image with its repository URI, image name, and tag.

    Attributes:
        repository_uri (str): The URI of the Docker repository.
        image_name (str): The name of the Docker image.
        tag (str): The tag of the Docker image. Defaults to "latest".
        region (str): The AWS region. Defaults to "ap-south-1".
    """

    def __init__(self, repository_uri: str, image_name: str, tag: str = "latest"):
        self.repository_uri = repository_uri
        self.image_name = image_name
        self.tag = tag
        self.region = os.getenv("AWS_REGION", "ap-south-1")

    @property
    def full_uri(self) -> str:
        """Returns the full URI of the Docker image, including the tag."""
        return f"{self.repository_uri}/{self.image_name}:{self.tag}"

    @property
    def uri_without_tag(self) -> str:
        """Returns the URI of the Docker image without the tag."""
        return f"{self.repository_uri}/{self.image_name}"


class DockerManager:
    """
    Manages Docker operations, including interacting with containers and
    authenticating with Amazon ECR.

    Attributes:
        docker_client (docker.DockerClient): Docker client instance.
    """

    docker_client: DockerClient = get_docker_client_from_env()

    @classmethod
    def get_current_container_id(cls) -> str:
        if EnvVariable.ENVIRONMENT.value == "local":
            import socket

            return socket.gethostname()
        else:
            try:
                with open("/proc/self/cgroup", "r") as f:
                    for line in f:
                        if "docker" in line or "ecs" in line:
                            # Extract the last part after the slash (the container ID).
                            return line.strip().split("/")[-1][
                                :12
                            ]  # Get the first 12 characters.
            except Exception as e:
                print(f"Error reading /proc/self/cgroup: {e}")
                return None

    @classmethod
    def get_host_paths(
        cls, container_id: str, container_paths: List[str]
    ) -> Dict[str, Optional[str]]:
        """
        Maps container paths to host paths for a given container.

        Args:
            container_id (str): ID of the container.
            container_paths (List[str]): List of container paths to map.

        Returns:
            Dict[str, Optional[str]]: A dictionary where the keys are container paths
            and values are the corresponding host paths or None if not found.
        """
        container = cls.docker_client.containers.get(container_id)
        mounts = container.attrs["Mounts"]
        result = {}

        for container_path in container_paths:
            for mount in mounts:
                if mount["Destination"] == container_path:
                    result[container_path] = mount["Source"]
                    break
            else:
                result[container_path] = None

        return result

    @classmethod
    def authenticate_to_ecr(cls, region: str, repository_uri: str) -> str:
        """
        Authenticates Docker to a specific private Amazon ECR repository.

        Args:
            region (str): AWS region where the ECR repository is located.
            repository_uri (str): Full URI of the ECR repository.

        Returns:
            str: The authenticated ECR URL.

        Raises:
            ValueError: If the provided repository URI does not match the ECR URL.
            Exception: For any other errors during authentication.
        """
        try:
            ecr_client = boto3.client("ecr", region_name=region)
            response = ecr_client.get_authorization_token()
            auth_data = response["authorizationData"][0]

            token = base64.b64decode(auth_data["authorizationToken"]).decode("utf-8")
            username, password = token.split(":")
            ecr_url = auth_data["proxyEndpoint"].replace("https://", "")

            if ecr_url == repository_uri:
                cls.docker_client.login(
                    username=username, password=password, registry=ecr_url
                )
                logger.info(f"Successfully authenticated to ECR: {repository_uri}")
            else:
                raise ValueError(
                    f"Provided repository URI {repository_uri} does not match ECR URL {ecr_url}."
                )

            return ecr_url

        except Exception as e:
            logger.error(f"Error during ECR authentication: {e}")
            raise

    @classmethod
    def run_container(cls, image: str, *args, **kwargs) -> Union[bytes, Container]:
        """
        Runs a Docker container using the specified image.

        Args:
            image (str): The image to use for the container.
            *args: Additional positional arguments for `containers.run`.
            **kwargs: Additional keyword arguments for `containers.run`.

        Returns:
            Union[bytes, Container]: Output of the container
            or the container instance.
        """
        return cls.docker_client.containers.run(image=image, *args, **kwargs)

    @classmethod
    def pull_image(cls, repository: str, tag: str, *args, **kwargs) -> Image:
        """
        Pulls a Docker image from a repository.

        Args:
            repository (str): The name of the repository.
            tag (str): The tag of the image.
            *args: Additional positional arguments for `images.pull`.
            **kwargs: Additional keyword arguments for `images.pull`.

        Returns:
            docker.models.images.Image: The pulled Docker image.
        """
        return cls.docker_client.images.pull(
            repository=repository, tag=tag, *args, **kwargs
        )

    @classmethod
    def container_cleanup(cls, container: Container):
        """
        Stops and removes a Docker container.

        Parameters:
        container (Container): A Docker container object representing the container
                            to be cleaned up.
        Logs:
        - INFO: Logs the start and successful completion of the cleanup process.
        - ERROR: Logs any exceptions encountered during the cleanup.

        Raises:
        - Logs an error if stopping or removing the container fails, but does not
        re-raise the exception.

        """
        logger.info("Starting container cleanup...")
        try:
            if container.status == "running":
                container.stop()
                logger.info("Container stopped successfully.")
            container.remove(force=True)
            logger.info("Container removed successfully.")
        except Exception as e:
            logger.error(f"Error during container cleanup: {e}")
