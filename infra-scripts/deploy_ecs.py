import os
from typing import Dict

destination_ecs = {
    "rb-backend-ecs-prod": [
        "rb-vector-server-svc-prod",
        "rb-terrain-server-svc-prod",
        "rb-api-engine-svc-prod",
        "rb-analytics-engine-svc-prod",
    ],
}


def deploy_ecs_services(ecs_config: Dict):
    for cluster in ecs_config:
        for svc in ecs_config[cluster]:
            os.system(
                f"aws ecs update-service --cluster {cluster} --service {svc} --force-new-deployment --profile cil-prod"
            )
            print(f"Deployment complete for {cluster}:{svc}")


if __name__ == "__main__":
    deploy_ecs_services(destination_ecs)
