import re


def is_number(value) -> bool:
    """
    Checks if the passed value is a number or not.
    """

    if isinstance(value, (int, float)):
        return True

    elif isinstance(value, str):
        return bool(re.match(r"^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$", value))

    return False
