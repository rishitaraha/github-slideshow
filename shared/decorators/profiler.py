import sys
import time
from functools import wraps

from memory_profiler import memory_usage

from rainbow import logger


def profile_mem_time(function):
    """
    A decorator for profiling the execution time and memory usage of a function.

    This decorator measures the memory consumption and execution time of a given function
    and logs the results using the provided logger.

    Usage:
    @profile_mem_time
    def my_function():
        # Your code here

    Args:
        function (callable): The function to be profiled.

    Returns:
        callable: A wrapped function with profiling capabilities.
    """

    @wraps(function)
    def inner(*args, **kwargs):
        # Skip profiling if running tests.
        if len(sys.argv) > 1 and sys.argv[1] == "test":
            return function(*args, **kwargs)

        function_profiled = f"{function.__name__}"

        start_time = time.perf_counter()
        memory, return_value = memory_usage(
            (function, args, kwargs), retval=True, timeout=200, interval=1e-7
        )

        memory_used = f"{max(memory) - min(memory)} MB"
        elapsed_time = time.perf_counter() - start_time
        formatted_elapsed_time = f"{elapsed_time:0.4} s"

        logger.debug(
            {
                "function": function_profiled,
                "time_elapsed": formatted_elapsed_time,
                "memory_used": memory_used,
            }
        )
        return return_value

    return inner
