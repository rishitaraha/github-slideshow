from typing import Union

from django.http import QueryDict

from shared.exception_handling import ValidationErrors


def unwrap_boolean(value: Union[int, str]) -> bool:
    """
    Convert various representations of boolean values to Python bool.

    Args:
        value: The value to convert to Python bool.

    Returns: The Python bool representation of the value.

    Raises:
        Exception: If the value does not match any known boolean representation.
    """

    TRUE_VALUES = {"true", "True", "y", "yes", "1", 1}
    FALSE_VALUES = {"false", "False", "n", "no", "0", 0}

    if value in TRUE_VALUES:
        return True
    elif value in FALSE_VALUES:
        return False
    else:
        raise Exception(ValidationErrors.INVALID_PARAMETER.value)


def unwrap_list(value: str | list) -> list:
    """
    Unwrap a string representation of a list into a Python list.

    Args:
        value: The value to unwrap. It can be either a string representing a list or a list itself.

    Returns: The unwrapped list.

    Raises:
        Exception: If the provided value is empty.
    """

    if not value:
        raise Exception(ValidationErrors.INVALID_PARAMETER.value)

    if isinstance(value, list):
        return value

    if value[0] == "[" and value[-1] == "]":
        value = value[1:-1]

    if value[-1] == ",":
        value = value[:-1]

    return value.split(",")


def parse_list_param(query_params: QueryDict, param_name: str) -> list | None:
    """
    Parse a list parameter from the given query parameters.

    Args:
        query_params: A QueryDict object containing the query parameters.
        param_name: The name of the parameter to parse.

    Returns: A list of parameter values if found, or None if the parameter is not present or empty.
    """

    # Handle param name alias.
    param_name_alias = f"{param_name}[]"
    if param_name_alias in query_params:
        return query_params.getlist(param_name_alias)

    # Handle multiple value which same key.
    if (field_data := query_params.getlist(param_name)) and len(field_data) > 1:
        return field_data

    # Handle comma separated values or single value.
    if value := query_params.get(param_name, False):
        return unwrap_list(value)

    # Handle indexed query params. like `?param[0]=1,param[1]=2`.
    values = []
    index = 0
    key = f"{param_name}[{index}]"

    while value := query_params.get(key, False):
        values.append(value)

        index += 1
        key = f"{param_name}[{index}]"

    if values:
        return values
