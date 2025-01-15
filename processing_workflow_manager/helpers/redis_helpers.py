import logging
from typing import Optional

import redis

from processing_workflow_manager.constants import ProcessingStatus
from rainbow.env_variables import EnvVariable
from shared.exception_handling import ApiErrors, GeneralException

logger = logging.getLogger(__name__)


class RedisClient:
    REDIS_CLIENT = None

    @classmethod
    def get_connection(cls):
        if cls.REDIS_CLIENT is None:
            redis_pool = redis.ConnectionPool(
                host=EnvVariable.REDIS_HOST_NAME.value,
                password=EnvVariable.REDIS_PASSWORD.value,
                port=6379,
            )
            cls.REDIS_CLIENT = redis.Redis(connection_pool=redis_pool)
        return cls.REDIS_CLIENT


VALID_PROCESSING_STATUS_TRANSITIONS = {
    ProcessingStatus.PENDING.value: {
        ProcessingStatus.PENDING.value: None,
        ProcessingStatus.PROCESSING.value: 0,
        ProcessingStatus.CANCELLED.value: None,
        ProcessingStatus.ERROR.value: None,
    },
    ProcessingStatus.PROCESSING.value: {
        ProcessingStatus.CANCELLED.value: None,
        ProcessingStatus.ERROR.value: None,
        ProcessingStatus.COMPLETED.value: 100,
    },
}


def validate_processing_state_transitions(current_state, next_state):
    if current_state == next_state:
        logger.error(f"Current State{current_state} is same as next state")
        return False

    if current_state not in VALID_PROCESSING_STATUS_TRANSITIONS:
        logger.error(
            f"Current state should be pending or processing not {current_state}"
        )
        return False

    if (
        current_state in VALID_PROCESSING_STATUS_TRANSITIONS
        and next_state not in VALID_PROCESSING_STATUS_TRANSITIONS[current_state]
    ):
        logger.error(f"Invalid status transition from {current_state} to {next_state}")
        return False

    return True


# Check the MCLI box when there is a change made in this method
def send_processing_progress_details_to_redis(
    process_id: str,
    current_state: ProcessingStatus,
    next_state: ProcessingStatus,
    progress_percentage: Optional[int] = None,
):
    if not validate_processing_state_transitions(current_state, next_state):
        raise GeneralException(ApiErrors.INVALID_STATUS_TRANSITION.value)

    try:
        redis_client = RedisClient.get_connection()
        redis_client.hset(process_id, "progress_status", next_state)

        if progress_percentage is None:
            progress_percentage = VALID_PROCESSING_STATUS_TRANSITIONS[current_state][
                next_state
            ]

        if progress_percentage is not None:
            redis_client.hset(process_id, "progress_percentage", progress_percentage)
    except Exception as e:
        logger.error(e)
        raise Exception("redis_progress_update_error")
