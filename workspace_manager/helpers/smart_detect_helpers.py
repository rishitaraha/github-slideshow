import json

from layer_manager.constants import LayerType
from layer_manager.models import Layer, LayerFile
from shared.aws import submit_analytics_job
from shared.constants import FileType, Status
from shared.models import FileInfo
from workspace_manager.constants import (
    SmartDetectOperation,
    SmartDetectOutputLayerName,
    SmartDetectType,
    SmartDetectWorkflow,
)
from workspace_manager.models.smart_detect_models import SmartDetect, SmartDetectOutput

SMART_DETECT_WORKFLOW_MAPPING = {
    SmartDetectType.BUILDING_FOOTPRINTS_OR_ROOF_TOPS.value: {
        "operation": SmartDetectOperation.DEEP_LEARNING_ANALYTICS.value,
        "workflow": SmartDetectWorkflow.RURAL_FEATURE_DETECTION.value,
        "output_layer_prefix": [
            SmartDetectOutputLayerName.RCC.value,
            SmartDetectOutputLayerName.TIN_SHEET.value,
            SmartDetectOutputLayerName.TILED_ROOF.value,
        ],
    },
    SmartDetectType.RIVERS_AND_STREAMS.value: {
        "operation": SmartDetectOperation.DEEP_LEARNING_ANALYTICS.value,
        "workflow": SmartDetectWorkflow.RURAL_FEATURE_DETECTION.value,
        "output_layer_prefix": [
            SmartDetectOutputLayerName.STREAM.value,
            SmartDetectOutputLayerName.RIVER.value,
        ],
    },
    SmartDetectType.PONDS_AND_LAKES.value: {
        "operation": SmartDetectOperation.DEEP_LEARNING_ANALYTICS.value,
        "workflow": SmartDetectWorkflow.RURAL_FEATURE_DETECTION.value,
        "output_layer_prefix": [
            SmartDetectOutputLayerName.POND.value,
            SmartDetectOutputLayerName.LAKE.value,
        ],
    },
    SmartDetectType.UNMETALLED_ROADS.value: {
        "operation": SmartDetectOperation.DEEP_LEARNING_ANALYTICS.value,
        "workflow": SmartDetectWorkflow.RURAL_FEATURE_DETECTION.value,
        "output_layer_prefix": [SmartDetectOutputLayerName.UNMETALLED_ROAD.value],
    },
    SmartDetectType.METALLED_ROADS.value: {
        "operation": SmartDetectOperation.DEEP_LEARNING_ANALYTICS.value,
        "workflow": SmartDetectWorkflow.RURAL_FEATURE_DETECTION.value,
        "output_layer_prefix": [SmartDetectOutputLayerName.METALLED_ROAD.value],
    },
    SmartDetectType.TREE_CANOPIES.value: {
        "operation": SmartDetectOperation.DEEP_LEARNING_ANALYTICS.value,
        "workflow": SmartDetectWorkflow.TREE_CANOPY_DETECTION.value,
        "output_layer_prefix": [SmartDetectOutputLayerName.TREE_CANOPY.value],
    },
    SmartDetectType.DRAINAGE_ANALYSIS.value: {
        "operation": SmartDetectOperation.MINE_ANALYTICS.value,
        "workflow": SmartDetectWorkflow.DRAINAGE_ANALYSIS.value,
        "output_layer_prefix": [SmartDetectOutputLayerName.STREAMS.value],
    },
    SmartDetectType.HEAP_DETECTION.value: {
        "operation": SmartDetectOperation.MINE_ANALYTICS.value,
        "workflow": SmartDetectWorkflow.HEAP_BOUNDARY_DETECTION.value,
        "output_layer_prefix": [SmartDetectOutputLayerName.HEAP_BOUNDARIES.value],
    },
    SmartDetectType.BENCH_TOE_CREST.value: {
        "operation": SmartDetectOperation.MINE_ANALYTICS.value,
        "workflow": SmartDetectWorkflow.BENCH_CREST_TOE_DETECTION.value,
        "output_layer_prefix": [
            SmartDetectOutputLayerName.CRESTS.value,
            SmartDetectOutputLayerName.TOES.value,
        ],
    },
}


def create_smart_detect_outputs_and_layers(
    validated_data, smart_detect: SmartDetect, aoi_wkt
):
    """
    Create SmartDetectOutput records, associated Layers, and submit batch jobs grouped by workflow.
    """
    # Group outputs by workflow
    workflow_groups = {}
    smart_detect_outputs_map = {}

    for smart_detect_output in validated_data.get("smart_detect_outputs", []):
        output_type = smart_detect_output.get("output_type")
        output_layer_suffix = smart_detect_output.get("name")

        if output_type not in SMART_DETECT_WORKFLOW_MAPPING:
            continue

        workflow_config = SMART_DETECT_WORKFLOW_MAPPING[output_type]
        workflow_key = f"{workflow_config['operation']}_{workflow_config['workflow']}"

        if workflow_key not in workflow_groups:
            workflow_groups[workflow_key] = {
                "config": workflow_config,
                "outputs": [],
                "output_objects": [],
            }

        # Create SmartDetectOutput record
        smart_detect_output_obj = SmartDetectOutput.objects.create(
            smart_detect=smart_detect, type=output_type
        )
        smart_detect_outputs_map[output_type] = smart_detect_output_obj

        # Create layers for each output type
        layers = []
        for output_layer_prefix in workflow_config["output_layer_prefix"]:
            layer = Layer.objects.create(
                name=f"{output_layer_prefix} - {output_layer_suffix}",
                iteration=smart_detect.iteration,
                site=smart_detect.iteration.site,
                type=LayerType.VECTOR.value,
            )
            fileInfo = FileInfo.objects.create(
                status=Status.PROCESSING.value, type=FileType.TEMPORARY.value
            )
            LayerFile.objects.create(layer=layer, file_info=fileInfo)
            layers.append(layer)

            workflow_groups[workflow_key]["outputs"].append(
                {"layer_id": str(layer.id), "type": output_layer_prefix}
            )

        smart_detect_output_obj.layers.add(*layers)
        workflow_groups[workflow_key]["output_objects"].append(smart_detect_output_obj)

    # Submit batch jobs for each unique workflow
    for workflow_key, workflow_data in workflow_groups.items():
        workflow_config = workflow_data["config"]
        job_name = f"smart_detect_{workflow_key}"

        operation = workflow_config["operation"]
        job_payload = {
            "operation": operation,
            "workflow": workflow_config["workflow"],
            "smart_detect_id": str(smart_detect.id),
            "outputs": json.dumps(workflow_data["outputs"]),
            "input_aoi_wkt": aoi_wkt,
        }
        if operation == SmartDetectOperation.DEEP_LEARNING_ANALYTICS.value:
            job_payload["input_ortho_s3_uri"] = (
                LayerFile.objects.filter(layer=smart_detect.input_ortho_layer)
                .first()
                .file_info.s3_uri
            )
        elif operation == SmartDetectOperation.MINE_ANALYTICS.value:
            job_payload[
                "input_dem_s3_uri"
            ] = smart_detect.iteration.captured_dsm_cog.s3_uri

        # Submit the batch job
        batch_job = submit_analytics_job(
            job_name,
            job_payload,
            with_gpu=operation == SmartDetectOperation.DEEP_LEARNING_ANALYTICS.value,
        )

        # Update all related SmartDetectOutput objects with the batch job
        for output_obj in workflow_data["output_objects"]:
            output_obj.batch_job = batch_job
            output_obj.save()
