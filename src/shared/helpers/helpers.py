import sys
from subprocess import CalledProcessError, run

from .. import logger


def run_command(command: str, shell=False):
    """
    Runs the given command in console.
    - Command should be in the arguments format.
    - Example - run_command(['echo',"Hello World!"])
    """
    try:
        output = run(
            command,
            shell,
            check=True,
        )
        logger.info(output.stdout)

    except CalledProcessError as cpe:
        logger.debug(cpe.output)
        logger.error(cpe)
        sys.exit(cpe.returncode)

    except Exception as exc:
        logger.debug("Unexpected error")
        logger.exception(exc)
        sys.exit(exc.returncode)


def unwrap_list(value: str | list) -> list:
    if not value:
        raise ValueError

    if isinstance(value, list):
        return value

    if (value[0] == "[" and value[-1] == "]") or (value[0] == "(" and value[-1] == ")"):
        value = value[1:-1]

    if value[-1] == ",":
        value = value[:-1]

    return value.split(",")
