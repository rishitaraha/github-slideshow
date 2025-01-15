import secrets
from typing import Dict, Optional, Type, TypeVar, Union
from uuid import UUID

from django.db.models import Model, QuerySet
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import NotFound

from shared.exception_handling import ApiError

from .query_params_helpers import unwrap_list

ModelInstanceType = TypeVar("ModelInstanceType", bound=Model)


def get_object_with_uuid(
    model_or_queryset: Union[Type[ModelInstanceType], QuerySet],
    id: str,
) -> ModelInstanceType:
    """
    Retrieves an object from a model or queryset using a UUID-based ID.
    If the provided `id` is a valid UUID, it fetches the object using
    Django's `get_object_or_404` method. If the object is not found or
    the `id` is not a valid UUID, it raises a `NotFound` exception.

    Parameters:
        model_or_queryset (Union[Type[ModelInstanceType], QuerySet]): A Django model class or queryset to search.
        id (str): The UUID string representing the ID of the object.

    Returns:
        ModelInstanceType: The model instance if found.

    Raises:
        NotFound: If the object with the given UUID does not exist or if UUID is not valid.
    """

    try:
        # Check if uuid is a valid UUID.
        uuid_obj = UUID(id, version=4)
        return get_object_or_404(model_or_queryset, id=uuid_obj)
    except Exception as exc:
        # This gives a general not found error message.
        if isinstance(model_or_queryset, QuerySet):
            object_name = model_or_queryset.model.__name__
        else:
            object_name = model_or_queryset.__name__
        raise NotFound(
            ApiError(f"The {object_name} does not exist.", "object_does_not_exist")
        ) from exc


def get_object_or_none(
    model_or_queryset: Union[Type[ModelInstanceType], QuerySet],
    *args,
    **kwargs,
) -> Optional[ModelInstanceType]:
    """
    Attempts to retrieve an object from a model or queryset based on the provided filtering criteria.
    It uses `get_object_or_404` internally to perform the lookup.
    If no object is found, instead of raising an exception, the function returns `None`.

    Parameters:
        model_or_queryset (Union[Type[ModelInstanceType], QuerySet]): A Django model class or queryset to search.
        *args: Additional positional arguments for filtering the queryset.
        **kwargs: Additional keyword arguments for filtering the queryset.

    Returns:
        Optional[ModelInstanceType]: The model instance if found, otherwise None.
    """

    try:
        return get_object_or_404(model_or_queryset, *args, **kwargs)
    except:
        return None


def generate_token_string():
    return secrets.token_hex(25)


def filter_dynamic_fields(
    model_or_queryset: Union[Type[ModelInstanceType], QuerySet], query_params: Dict
) -> QuerySet:
    """
    The `filter_dynamic_fields` function filters the fields of a model or queryset based on the
    include_fields and exclude_fields parameters provided in the query_params.

    - Args
        - model_or_queryset: The `model_or_queryset` parameter can be either a Django model class or a
    queryset
        - query_params: The `query_params` parameter is a dictionary that contains the query parameters
    passed to the function. It is expected to have two keys: "include_fields" or "exclude_fields"
    - Returns
      - filtered queryset based on the provided model or queryset and the query parameters.
    """
    include_fields = query_params.get("include_fields")
    exclude_fields = query_params.get("exclude_fields")

    if isinstance(model_or_queryset, QuerySet):
        model_field = set(
            (map(lambda field: field.name, model_or_queryset.model._meta.fields))
        )
        queryset = model_or_queryset
    elif isinstance(model_or_queryset, Model):
        model_field = set(
            (map(lambda field: field.name, model_or_queryset._meta.fields))
        )
        # To get QuerySet from the model.
        queryset = model_or_queryset.objects.all()
    else:
        raise ValueError("Invalid value of model_or_queryset")

    if include_fields:
        include_fields = set(unwrap_list(include_fields))
        queryset = queryset.only(*model_field.intersection(include_fields))
    elif exclude_fields:
        exclude_fields = set(unwrap_list(exclude_fields))
        queryset = queryset.defer(*model_field.intersection(exclude_fields))

    return queryset


def model_to_dict(
    instance: Type[ModelInstanceType], *, use_column_as_key=False
) -> Dict[str, any]:
    """
    Convert a Django model instance to a dictionary.

    Args:
    - instance: The Django model instance.
    - use_column_as_key: If True, the column name will be used as key of dict otherwise the field name will be used.

    Returns:
      A dictionary with column names as keys and corresponding values.
    """

    model_dict: Dict[str, any] = {}

    for field in instance._meta.fields:
        key = field.column if use_column_as_key else field.name
        value = getattr(instance, field.attname)
        model_dict[key] = value

    return model_dict
