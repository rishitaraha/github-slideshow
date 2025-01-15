from rainbow.env_variables import EnvVariable

# Check if Analytics Engine Batch is present in the current env.
IS_ANALYTICS_BATCH_ENABLED = (
    EnvVariable.AWS_BATCH_ANALYTICS_ENGINE_JOB_QUEUE.value is not None
    and EnvVariable.AWS_BATCH_ANALYTICS_ENGINE_JOB_DEFINITION.value is not None
)
