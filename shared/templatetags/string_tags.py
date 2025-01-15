import re

from django import template

register = template.Library()

# Ref: https://docs.djangoproject.com/en/4.1/howto/custom-template-tags/
@register.filter
def deslugify(slug):
    return re.sub("[-/_]+", " ", re.sub("[^\w\s-]", "", slug)).strip()
