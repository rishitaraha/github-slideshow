from django.db.models import QuerySet
from rest_framework.validators import ValidationError

from shared.exception_handling import ValidationErrors

from .models import Iteration


def heaps_has_same_iteration_or_400(heaps: QuerySet) -> Iteration:
    """
    Checks if all heaps belongs to same iteration.
    if all heaps belongs to same iteration then this function will return that iteration otherwise it will raise a validation error.
    """

    iteration_ids = heaps.values_list("iteration", flat=True).distinct()
    if iteration_ids.count() > 1:
        raise ValidationError(ValidationErrors.ALL_HEAPS_MUST_HAVE_SAME_ITERATION.value)

    return heaps.first().iteration
