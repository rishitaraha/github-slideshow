from uuid import uuid4

from django.db.models import Case, IntegerField, Value, When
from django.urls import reverse
from rest_framework import serializers

from analytics_engine_manager.operations import subtract_dsm
from layer_manager.constants import LayerType
from layer_manager.helpers import import_orthomosaic_as_layer
from layer_manager.models import Layer, LayerFile
from layer_manager.serializers import RetrieveLayerSerializer
from shared.constants import FileStatus, FileType
from shared.exception_handling import ValidationErrors
from shared.helpers import create_s3_file_key, slugify
from shared.models import FileInfo

from ..models import Iteration
from .iterations import RetrieveIterationSerializer


class SubtractDsmSerializer(serializers.Serializer):
    date = serializers.DateField()
    first_iteration: Iteration = serializers.PrimaryKeyRelatedField(
        queryset=Iteration.objects.all()
    )
    second_iteration: Iteration = serializers.PrimaryKeyRelatedField(
        queryset=Iteration.objects.all()
    )
    ortho_layer: Layer = serializers.PrimaryKeyRelatedField(
        queryset=Layer.objects.all()
    )
    new_iteration_name = serializers.CharField(max_length=200)
    threshold_value = serializers.FloatField()

    class Meta:
        model = Iteration

    def validate(self, data):
        validation_errors = {}

        validated_data = super().validate(data)

        # First and second iteration should be unique together.
        if data["first_iteration"] == data["second_iteration"]:
            validation_errors[
                "form"
            ] = ValidationErrors.ITERATIONS_SHOULD_BE_UNIQUE_TOGETHER.value

        # Raise validation error if exist.
        if validation_errors:
            raise serializers.ValidationError(validation_errors)

        return validated_data

    def create(self, validated_data):
        user = self.context["user"]
        first_iteration: Iteration = validated_data["first_iteration"]
        second_iteration: Iteration = validated_data["second_iteration"]
        ortho_layer: Layer = validated_data["ortho_layer"]

        # Creating new iteration for the subtracted dsm.
        iteration = Iteration(
            name=validated_data["new_iteration_name"],
            date=validated_data["date"],
            site=first_iteration.site,
        )

        # Fetch DSMs for both iterations.
        first_dsm = first_iteration.get_dsm_or_404()
        second_dsm = second_iteration.get_dsm_or_404()

        # Creating FileInfo objects for dsm of new iteration.
        new_dsm_filename = f"{slugify(validated_data['new_iteration_name'])}_DSM.tif"
        new_dsm_id = uuid4()
        new_dsm_s3_key = create_s3_file_key(
            FileType.CAPTURED_DSM.value, f"{str(new_dsm_id)}.tif"
        )

        new_dsm_file_info = FileInfo.objects.create(
            id=new_dsm_id,
            name=new_dsm_filename,
            type=FileType.CAPTURED_DSM.value,
            s3_key=new_dsm_s3_key,
            status=FileStatus.STARTED.value,
            org=user.org,
            created_by=user,
        )

        iteration.captured_dsm = new_dsm_file_info

        new_dsm_update_status_url = reverse(
            "files-status",
            kwargs={
                "pk": str(new_dsm_file_info.id),
            },
        )

        # Making request to analytics engine for subtracting DSMs.
        subtract_dsm(
            first_dsm.s3_key,
            second_dsm.s3_key,
            validated_data["threshold_value"],
            new_dsm_s3_key,
            new_dsm_update_status_url,
        )

        # Save the iteration.
        iteration.save()

        new_ortho_layer = Layer.objects.create(
            name=ortho_layer.name,
            iteration=iteration,
            site=iteration.site,
            type=LayerType.ORTHOMOSAIC.value,
        )

        # Get ortho layer's file info object.
        # ortho cog file object has higher priority than ortho file object.
        ortho_layer_file_info = LayerFile.objects.filter(
            layer=ortho_layer,
            file_info__type__in=[
                FileType.ORTHOMOSAIC_COG.value,
                FileType.ORTHOMOSAIC.value,
            ],
        ).order_by(
            Case(
                When(
                    file_info__type=FileType.ORTHOMOSAIC_COG.value,
                    then=Value(0),
                ),
                default=Value(
                    1
                ),  # Default ordering will happen if all the records are assigned the default value.
                output_field=IntegerField(),
            ),
        )

        if ortho_layer_file_info.exists():
            ortho_layer_file_info = ortho_layer_file_info[0].file_info
            # Copy orthomosaic file and create new file info instance for new iteration's ortho layer.
            new_layer_file = import_orthomosaic_as_layer(
                new_layer=new_ortho_layer,
                source_bucket_name=ortho_layer_file_info.bucket_name,
                source_file_s3_key=ortho_layer_file_info.s3_key,
                filename=ortho_layer_file_info.name,
                org=user.org,
            )
            validated_data["new_ortho_layer_file_info"] = new_layer_file.file_info
            new_ortho_layer.save()
        elif ortho_layer.source_id:
            new_ortho_layer.source_id = ortho_layer.source_id
            new_ortho_layer.save()

        validated_data["new_ortho_layer"] = new_ortho_layer
        validated_data["iteration"] = iteration

        return validated_data

    def to_representation(self, instance):
        # Returning iteration and layer.
        iteration_serializer = RetrieveIterationSerializer(
            instance["iteration"], exclude_fields=["iteration_dataset"]
        )
        layer_serializer = RetrieveLayerSerializer(instance["new_ortho_layer"])

        return {
            **iteration_serializer.data,
            "layer": layer_serializer.data,
        }
