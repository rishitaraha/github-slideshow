import threading
from concurrent.futures import ThreadPoolExecutor

from rainbow import background_task_logger

from .decorators import profile_mem_time


class BackgroundTaskManager:
    """
    This class serves as a centralized manager for a shared thread pool,
    facilitating concurrent task execution.
    """

    _instance = None

    """
        _lock is a class-level lock from the threading module.
        It's used to ensure that the singleton creation is thread-safe.
    """
    _lock = threading.Lock()

    def __new__(cls):
        """
        We acquire the lock to ensure only one thread
        at a time can access this critical section. This is
        done in order to prevent multiple threads to execute this
        block simultaneously. So we don't create multiple instances
        of this class.

        Ref: https://refactoring.guru/design-patterns/singleton/python/example#example-1
        """
        if cls._instance is None:
            with cls._lock:
                cls._instance = super(BackgroundTaskManager, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        # Create the thread pool only once.
        if not hasattr(self, "_thread_pool"):
            self._thread_pool = ThreadPoolExecutor(max_workers=4)

    @profile_mem_time
    def submit_task(self, task, *args, **kwargs):
        def task_exception_handler():
            try:
                return task(*args, **kwargs)
            except Exception as e:
                background_task_logger.exception(e)

        self._thread_pool.submit(task_exception_handler)
