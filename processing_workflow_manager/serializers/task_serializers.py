import json

from django.contrib.gis.db.backends.postgis.models import PostGISSpatialRefSys
from django.contrib.gis.gdal import GDALException
from django.contrib.gis.geos import GeometryCollection, GEOSGeometry
from django.contrib.gis.geos.error import GEOSException
from django.core.serializers import serialize
from rest_framework import serializers

from processing_workflow_manager.constants import (
    FINAL_PROCESSING_STATUSES,
    ContinuedFromDatasetType,
    CroppingRegionBehaviour,
    InstanceSizeTypes,
    ProcessingStatus,
    TaskStageNameInDatabase,
)
from processing_workflow_manager.helpers import (
    get_output_file_info_values,
    send_processing_progress_details_to_redis,
    validate_processing_state_transitions,
    validate_task_options_and_stages_combinations,
)
from processing_workflow_manager.models import ProcessingIterationData, Task
from shared.constants import VerticalCRS
from shared.exception_handling import ApiErrors, ValidationErrors
from shared.signals import update_batch_job_details

from .gcp_serializers import TaskGCPImageTagSerializer, TaskGCPSerializer
from .geotag_image_serializers import TaskGeotagForProcessingSerializer


class TaskUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ProcessingStatus.choices(), required=True)
    name = serializers.CharField(max_length=255)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.save()
        return instance

    class Meta:
        model = Task
        fields = "__all__"


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=ProcessingStatus.choices(), required=True)

    def validate(self, data):
        current_task_status = self.context["current_task_status"]
        if next_task_status := data.get("status"):
            if next_task_status == ProcessingStatus.CANCELLED.value:
                raise serializers.ValidationError(
                    {"status": ValidationErrors.TASK_CANCELLATION_NOT_ALLOWED.value}
                )

            if not validate_processing_state_transitions(
                current_task_status, next_task_status
            ):
                raise serializers.ValidationError(
                    {"status": ApiErrors.INVALID_STATUS_TRANSITION.value}
                )

        return super().validate(data)

    def update(self, instance: Task, validated_data):
        next_task_status = validated_data.get("status")
        current_task_status = instance.status
        if next_task_status:
            if current_task_status in FINAL_PROCESSING_STATUSES:
                # This will prevent super().update to save status from request data.
                validated_data.pop("status")

            elif next_task_status == ProcessingStatus.COMPLETED.value:
                send_processing_progress_details_to_redis(
                    process_id=str(instance.id),
                    current_state=ProcessingStatus.PROCESSING.value,
                    next_state=ProcessingStatus.COMPLETED.value,
                )

            elif next_task_status == ProcessingStatus.PROCESSING.value:
                send_processing_progress_details_to_redis(
                    str(instance.id),
                    current_state=current_task_status,
                    next_state=ProcessingStatus.PROCESSING.value,
                )

            elif next_task_status == ProcessingStatus.ERROR.value:
                send_processing_progress_details_to_redis(
                    str(instance.id),
                    current_state=current_task_status,
                    next_state=ProcessingStatus.ERROR.value,
                )

        if instance.batch_job_details:
            update_batch_job_details(batch_job=instance.batch_job_details)

        return super().update(instance, validated_data)

    class Meta:
        model = Task
        fields = [
            "status",
            "is_ortho_present",
            "is_dem_present",
            "is_dense_point_cloud_present",
            "is_sparse_point_cloud_present",
        ]


class TaskSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=255)
    options = serializers.JSONField()
    end_stage = serializers.ChoiceField(
        choices=TaskStageNameInDatabase.choices(),
        required=False,
        allow_null=True,
    )
    continued_from_task = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.all()
        .select_related("iteration_dataset", "merged_dataset")
        .prefetch_related("taskgeotagimages"),
        required=False,
        allow_null=True,
    )
    continued_from = serializers.ChoiceField(
        choices=[
            ContinuedFromDatasetType.TASK.value,
            ContinuedFromDatasetType.PARENT_ITERATION.value,
        ],
        required=True,
    )
    instance_name = serializers.ChoiceField(
        choices=InstanceSizeTypes,
        required=False,
        allow_null=True,
        read_only=True,
    )
    iteration_dataset = serializers.PrimaryKeyRelatedField(
        queryset=ProcessingIterationData.objects.all().select_related(
            "iteration", "image_folder_path", "iteration__site"
        ),
        required=False,
    )
    cropping_region_behaviour = serializers.ChoiceField(
        choices=CroppingRegionBehaviour.choices(),
        required=False,
        allow_null=True,
    )
    clipping_boundary = serializers.JSONField(required=False, allow_null=True)
    cropping_region = serializers.JSONField(required=False, allow_null=True)
    output_horizontal_crs = serializers.PrimaryKeyRelatedField(
        queryset=PostGISSpatialRefSys.objects.all(),
        required=False,
        allow_null=True,
    )
    output_vertical_crs = serializers.ChoiceField(
        choices=VerticalCRS.choices(), required=False, allow_null=True
    )

    def get_continued_from_task_name(self, obj: Task):
        return obj.continued_from_task_name

    def validate_geojson(self, data):
        try:
            parsed_data = json.loads(data) if isinstance(data, str) else data
            features_collection = [
                GEOSGeometry(json.dumps(feature["geometry"]))
                for feature in parsed_data.get("features", [])
            ]
            return GeometryCollection(features_collection)
        except (ValueError, TypeError, GEOSException, GDALException):
            raise serializers.ValidationError(
                ValidationErrors.INVALID_GEOJSON_UPLOADED.value
            )

    def validate_clipping_boundary(self, data):
        return self.validate_geojson(data) if data else None

    def validate_cropping_region(self, data):
        if not data:
            return None
        geometry = self.validate_geojson(data)
        if geometry and len(geometry) != 1:
            raise serializers.ValidationError(
                ValidationErrors.ONLY_ONE_POLYGON_ALLOWED.value
            )
        return geometry

    def validate_iteration_dataset(self, data: ProcessingIterationData):
        if data.is_preparing_geotags:
            raise serializers.ValidationError(
                ValidationErrors.GEOTAGS_BEING_PROCESSED.value
            )
        if not data.are_geotags_present:
            raise serializers.ValidationError(ValidationErrors.NO_GEOTAGS_FOUND.value)
        return data

    def get_input_crs(
        self,
        continued_from,
        continued_from_task,
        is_reoptimize_task,
        iteration_dataset,
    ):
        if (
            continued_from_task
            and continued_from == ContinuedFromDatasetType.TASK.value
            and not is_reoptimize_task
        ):
            return (
                continued_from_task.input_geotag_horizontal_crs,
                continued_from_task.input_gcp_horizontal_crs,
                continued_from_task.input_geotag_vertical_crs,
                continued_from_task.input_gcp_vertical_crs,
                continued_from_task.rotation_angle_type,
            )
        return (
            iteration_dataset.geotag_horizontal_crs,
            iteration_dataset.gcp_horizontal_crs,
            iteration_dataset.geotag_vertical_crs,
            iteration_dataset.gcp_vertical_crs,
            iteration_dataset.rotation_angle_type,
        )

    def validate(self, data):
        name = data.get("name", "")
        if not name:
            raise serializers.ValidationError(ValidationErrors.NAME_NOT_PROVIDED.value)
        options_dict = json.loads(data.get("options", "{}"))
        optimization_options = options_dict.get("optimization-options", {})

        # Validate task combinations
        validate_task_options_and_stages_combinations(data, optimization_options)

        return data

    def create(self, validated_data):
        validated_data.update(self.context)
        validated_data["name"] = validated_data["name"].strip()

        # Set input CRS
        options_dict = json.loads(validated_data.get("options", "{}"))
        optimization_options = options_dict.get("optimization-options", {})
        is_reoptimize_task = optimization_options.get("reoptimize-cameras", False)
        continued_from = validated_data.get("continued_from")
        continued_from_task = validated_data.get("continued_from_task")
        iteration_dataset = validated_data.get("iteration_dataset")

        (
            validated_data["input_geotag_horizontal_crs"],
            validated_data["input_gcp_horizontal_crs"],
            validated_data["input_geotag_vertical_crs"],
            validated_data["input_gcp_vertical_crs"],
            validated_data["rotation_angle_type"],
        ) = self.get_input_crs(
            continued_from,
            continued_from_task,
            is_reoptimize_task,
            iteration_dataset,
        )

        validated_data["status"] = ProcessingStatus.PENDING.value

        options_dict = json.loads(validated_data.get("options", "{}"))
        optimization_options = options_dict.get("optimization-options", {})
        if optimization_options.get("stop-after-reoptimize"):
            validated_data["end_stage"] = TaskStageNameInDatabase.ALIGN_PHOTOS.value

        if continued_from_task_obj := validated_data.get("continued_from_task"):
            validated_data["continued_from_task"] = continued_from_task_obj

        task: Task = super().create(validated_data)

        output_files_info = get_output_file_info_values(task)

        for field, value in output_files_info.items():
            setattr(task, field, value)

        task.save()

        return task

    class Meta:
        model = Task
        fields = "__all__"


class TaskDetailSerializer(serializers.ModelSerializer):
    optimization_options = serializers.SerializerMethodField("get_optimization_options")
    clipping_boundary = serializers.SerializerMethodField("get_clipping_boundary")
    cropping_region = serializers.SerializerMethodField("get_cropping_region")
    images_path = serializers.SerializerMethodField("get_images_path")
    # TODO: Use BatchJobSerializer to get batch_job details.
    output_files_path = serializers.CharField(read_only=True)
    output_project_file_s3_object_key = serializers.CharField(read_only=True)
    output_dense_point_cloud_s3_object_key = serializers.CharField(read_only=True)
    output_dem_s3_object_key = serializers.CharField(read_only=True)
    output_dem_cog_s3_object_key = serializers.CharField(read_only=True)
    output_ortho_s3_object_key = serializers.CharField(read_only=True)
    output_ortho_cog_s3_object_key = serializers.CharField(read_only=True)
    output_ortho_tile_zip_s3_object_key = serializers.CharField(read_only=True)
    output_report_s3_object_key = serializers.CharField(read_only=True)
    output_all_assets_zip_s3_object_key = serializers.CharField(read_only=True)
    log_stream_name = serializers.SerializerMethodField("get_log_stream_name")

    def get_optimization_options(self, obj: Task):
        options_json = json.loads(obj.options) if obj.options else {}
        return options_json.get("optimization-options", {})

    def get_log_stream_name(self, obj: Task):
        if obj.batch_job_details:
            return obj.batch_job_details.log_stream_name
        return ""

    def get_clipping_boundary(self, obj: Task):
        if obj.clipping_boundary:
            return serialize(
                "geojson",
                [obj],
                geometry_field="clipping_boundary",
                fields=["clipping_boundary"],
            )
        else:
            return None

    def get_cropping_region(self, obj: Task):
        if obj.cropping_region:
            return serialize(
                "geojson",
                [obj],
                geometry_field="cropping_region",
                fields=["cropping_region"],
            )
        else:
            return None

    def get_images_path(sekf, obj: Task):
        return getattr(
            getattr(
                getattr(obj, "merged_dataset", None),
                "input_image_s3_folder_info",
                None,
            ),
            "s3_key",
            "",
        ) or getattr(
            getattr(
                getattr(obj, "iteration_dataset", None),
                "image_folder_path",
                None,
            ),
            "s3_key",
            "",
        )

    def to_representation(self, instance: Task):
        data = super().to_representation(instance)

        data.update(
            {
                "iteration_dataset_name": getattr(
                    instance.iteration_dataset, "name", ""
                ),
                "continued_from_task_end_stage": getattr(
                    instance.continued_from_task, "end_stage", ""
                ),
                "site_name": getattr(
                    getattr(instance.iteration_dataset.iteration, "site", None),
                    "name",
                    "",
                ),
                "merged_dataset_name": getattr(instance.merged_dataset, "name", ""),
                "output_files_path": getattr(
                    getattr(instance, "output_folder_path", ""), "s3_key", ""
                ),
                "output_project_file_s3_object_key": getattr(
                    getattr(instance, "output_project_file_info", ""),
                    "s3_key",
                    "",
                ),
                "output_dense_point_cloud_s3_object_key": getattr(
                    getattr(instance, "output_dense_point_cloud_file_info", ""),
                    "s3_key",
                    "",
                ),
                "output_dem_s3_object_key": getattr(
                    getattr(instance, "output_dem", ""), "s3_key", ""
                ),
                "output_dem_cog_s3_object_key": getattr(
                    getattr(instance, "output_dem_cog", ""), "s3_key", ""
                ),
                "output_ortho_s3_object_key": getattr(
                    getattr(instance, "output_ortho", ""), "s3_key", ""
                ),
                "output_ortho_cog_s3_object_key": getattr(
                    getattr(instance, "output_ortho_cog", ""), "s3_key", ""
                ),
                "output_ortho_tile_zip_s3_object_key": getattr(
                    getattr(instance, "output_ortho_tile_zip", ""), "s3_key", ""
                ),
                "output_report_s3_object_key": getattr(
                    getattr(instance, "output_report", ""), "s3_key", ""
                ),
                "output_all_assets_zip_s3_object_key": getattr(
                    getattr(instance, "output_all_assets_zip", ""), "s3_key", ""
                ),
            }
        )

        return data

    class Meta:
        model = Task
        fields = [
            "id",
            "serial_id",
            "name",
            "iteration_dataset_id",
            "merged_dataset_id",
            "optimization_options",
            "status",
            "continued_from_task_name",
            "iteration_dataset",
            "merged_dataset",
            "options",
            "preset_id",
            "x_average_error",
            "y_average_error",
            "z_average_error",
            "created_by",
            "created_at",
            "updated_at",
            "images_path",
            "output_files_path",
            "output_project_file_s3_object_key",
            "output_dense_point_cloud_s3_object_key",
            "output_dem_s3_object_key",
            "output_dem_cog_s3_object_key",
            "output_ortho_s3_object_key",
            "output_ortho_cog_s3_object_key",
            "output_ortho_tile_zip_s3_object_key",
            "output_report_s3_object_key",
            "output_all_assets_zip_s3_object_key",
            "log_stream_name",
            "end_stage",
            "continued_from_task",
            "continued_from",
            "is_ortho_present",
            "is_sparse_point_cloud_present",
            "is_dem_present",
            "is_dense_point_cloud_present",
            "rotation_angle_type",
            "clipping_boundary",
            "input_geotag_horizontal_crs",
            "input_gcp_horizontal_crs",
            "input_geotag_vertical_crs",
            "input_gcp_vertical_crs",
            "output_horizontal_crs",
            "output_vertical_crs",
            "cropping_region",
            "cropping_region_behaviour",
        ]


class RetrieveTaskForProcessingJobSerializer(TaskDetailSerializer):
    geotags = serializers.SerializerMethodField()
    gcps = serializers.SerializerMethodField()
    gcp_image_tags = serializers.SerializerMethodField()

    def get_geotags(self, obj):
        geotags = self.context["geotags"]
        return TaskGeotagForProcessingSerializer(geotags, many=True).data

    def get_gcps(self, obj):
        gcps = self.context["gcps"]
        return TaskGCPSerializer(gcps, many=True).data

    def get_gcp_image_tags(self, obj):
        gcp_image_tags = self.context["gcp_image_tags"]
        return TaskGCPImageTagSerializer(gcp_image_tags, many=True).data

    class Meta(TaskDetailSerializer.Meta):
        fields = TaskDetailSerializer.Meta.fields + [
            "geotags",
            "gcps",
            "gcp_image_tags",
        ]


class TaskGeotagErrorSerializer(serializers.Serializer):
    geotags_error_data = serializers.DictField(
        child=serializers.DictField(), required=True
    )
    average_errors = serializers.DictField(required=True)

    def validate(self, data):
        if not data.get("geotags_error_data"):
            raise serializers.ValidationError(
                ValidationErrors.GEOTAG_ERRORS_NOT_FOUND.value
            )
        for key, value in data.get("geotags_error_data").items():
            if not all(
                [
                    value.get("error_x"),
                    value.get("error_y"),
                    value.get("error_z"),
                    value.get("norm_error"),
                ]
            ):
                raise serializers.ValidationError(
                    ValidationErrors.GEOTAG_ERROR_MALFORMED_REQUEST.value
                )
        if average_errors := data.get("average_errors"):
            if {"x_avg_error", "y_avg_error", "z_avg_error"}.difference(
                set(average_errors.keys())
            ):
                raise serializers.ValidationError(
                    ValidationErrors.AVERAGE_ERRORS_NOT_FOUND.value
                )

        return super().validate(data)


class TaskGeotagImageAlignmentSerializer(serializers.Serializer):
    aligned_cameras = serializers.ListField(
        child=serializers.CharField(), required=True
    )
