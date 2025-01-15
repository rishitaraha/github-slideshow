import logging


def init_logger(logger_name: str = "DEFAULT_LOGGER") -> logging.Logger:
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.DEBUG)

    if not logger.hasHandlers():
        # Create console handler and set level to debug.
        console_logging_handler = logging.StreamHandler()
        console_logging_handler.setLevel(logging.DEBUG)

        log_format: str = "%(levelname)s %(asctime)s | %(message)s"

        formatter = logging.Formatter(log_format, datefmt="%Y-%m-%d %H:%M:%S")

        # Add formatter.
        console_logging_handler.setFormatter(formatter)

        # Add console Handler to logger.
        logger.addHandler(console_logging_handler)

    return logger
