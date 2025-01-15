import re

from django.forms import ValidationError

from shared.exception_handling import ValidationErrors


def validate_no_space(value):
    if " " in value:
        raise ValidationError(ValidationErrors.SPACE_NOT_ALLOWED.value)


def validate_color_field(value):
    # Regex for checking only hex codes of length 6 or 8 are accepted.
    if not re.search(r"^#(?:[0-9a-fA-F]{3,4}){1,2}$", value):
        raise ValidationError(ValidationErrors.ONLY_HEX_COLOR_CODES_ALLOWED.value)


def validate_month_field(value):
    if value < 1 or value > 12:
        raise ValidationError(ValidationErrors.INVALID_MONTH.value)
