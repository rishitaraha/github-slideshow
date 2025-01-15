from django.http import QueryDict
from rest_framework.serializers import ListField, Serializer, empty

from ...helpers import parse_list_param


class QueryParamSerializerMixin(Serializer):
    """
    A mixin class for serializers that handles processing of query parameters.

    This mixin is designed to be used with serializers in Django REST Framework.
    It provides functionality to process query parameters, particularly list fields,
    and convert them into a format suitable for serialization.

    Example usage:
    ```
    class MySerializer(QueryParamSerializerMixin, serializers.ModelSerializer):
        # Define your serializer fields here.
        pass
    ```
    """

    def __init__(self, instance=None, data: QueryDict | empty = empty, **kwargs):
        if data is empty:
            return super().__init__(instance, data, **kwargs)

        self.instance = instance
        data_dict = data.dict()

        for field_name, field_type in self.get_fields().items():
            # Process list field values.
            if field_type.__class__ == ListField:
                data_dict[field_name] = parse_list_param(data, field_name)

        super().__init__(instance, data_dict, **kwargs)
