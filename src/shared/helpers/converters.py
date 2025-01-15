from typing import Union


def unwrap_boolean(value: Union[int, str]) -> bool:
    TRUE_VALUES = {"true", "True", "y", "yes", "1", 1}
    FALSE_VALUES = {"false", "False", "n", "no", "0", 0}

    if value in TRUE_VALUES:
        return True
    elif value in FALSE_VALUES:
        return False
    else:
        raise ValueError
