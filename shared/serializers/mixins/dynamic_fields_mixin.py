from rest_framework.serializers import ValidationError

from ...exception_handling import GeneralException, ValidationErrors
from ...helpers import unwrap_list


class DynamicFieldsSerializerMixin:
    """
    A mixin class for handling dynamic fields (include_fields/exclude_fields) in serializers.

    This mixin allows controlling which fields are included or excluded in the serializer output
    based on dynamic parameters provided during serialization. It enables greater flexibility
    in constructing responses tailored to specific use cases.

    CAUTION: This class should always be inherited before the serializer class.

    Example usage:
    ```
    # Define Serializer.
    class MySerializer(DynamicFieldsSerializerMixin, serializers.ModelSerializer):
        field1 = serializers.CharField()

        class Meta:
            model = MyModel
            fields = '__all__'

    # Use serializer.
    serializer = MySerializer(
        data,
        many=True,
        include_fields = ['field1', 'field2'],
        exclude_fields = ['field3'],
    )
    ```
    """

    def __init__(self, *args, **kwargs):
        include_fields = kwargs.pop("include_fields", None)
        exclude_fields = kwargs.pop("exclude_fields", None)

        super(DynamicFieldsSerializerMixin, self).__init__(*args, **kwargs)

        existing_fields = set(self.fields.keys())
        if include_fields and exclude_fields:
            raise ValidationError(ValidationErrors.INVALID_FIELDS_PARAM.value)

        elif include_fields:
            include_fields = set(unwrap_list(include_fields))
            self._check_invalid_fields(existing_fields, include_fields)
            if include_fields:
                # Remove all the remaining fields after included fields.
                for field_name in existing_fields - include_fields:
                    self.fields.pop(field_name)

        elif exclude_fields:
            exclude_fields = set(unwrap_list(exclude_fields))
            self._check_invalid_fields(existing_fields, exclude_fields)

            if exclude_fields:
                # Remove fields which are not required.
                for field_name in existing_fields.intersection(exclude_fields):
                    self.fields.pop(field_name)

    def _check_invalid_fields(self, serializer_fields: set, fields: set):
        invalid_fields = fields - serializer_fields

        if len(invalid_fields) != 0:
            invalid_fields = ",".join(list(invalid_fields))
            raise GeneralException(f"Invalid fields passed: {invalid_fields}")

        return True
