from typing import Union


def unwrap_boolean(value: Union[int, str]) -> bool:
    TRUE_VALUES = {"true", "True", "y", "yes", "1", 1}

    if value in TRUE_VALUES:
        return True

    return False


def unwrap_list(value: str | list) -> list:
    if not value:
        raise Exception("None value for a list was passed.")

    if isinstance(value, list):
        return value

    if value[0] == "[" and value[-1] == "]":
        value = value[1:-1]

    if value[-1] == ",":
        value = value[:-1]

    return value.split(",")
