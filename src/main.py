import os

from .clamp_to_terrain import clamp_to_terrain
from .config.sentry_config import setup_sentry
from .extract_mbtiles import extract_mbtile
from .operations.ds import (
    execute_deep_learning_analytics,
    execute_hra,
    execute_mine_analytics,
)
from .runner import OperationRunner
from .subtract_dsm import subtract_dsm

runner = OperationRunner()

# Sentry setup.
setup_sentry()

# Register operations.
runner.add_operation("subtract_dsm", subtract_dsm)
runner.add_operation("clamp_to_terrain", clamp_to_terrain)
runner.add_operation("extract_mbtile", extract_mbtile)
runner.add_operation("hra", execute_hra)
runner.add_operation("deep_learning_analytics", execute_deep_learning_analytics)
runner.add_operation("mine_analytics", execute_mine_analytics)


if __name__ == "__main__":
    data = dict(os.environ)
    operation = data.pop("operation")
    payload = data

    # Run the operation.
    runner.run(operation=operation, payload=payload)
