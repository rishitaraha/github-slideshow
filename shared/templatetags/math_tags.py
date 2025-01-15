import math

from django import template

register = template.Library()


@register.filter
def is_inf(value):
    return math.isinf(value)
