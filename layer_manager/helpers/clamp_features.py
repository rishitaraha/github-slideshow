from django.urls import reverse

from analytics_engine_manager.operations import start_feature_clamping

from ..models import Feature


def send_features_to_clamp(layer_id: str, dsm_cog_s3_key: str):
    return start_feature_clamping(
        {
            "layer_id": str(layer_id),
            "bounds": Feature.objects.get_bounds(layer_id),
            "dsm_cog_s3_key": dsm_cog_s3_key,
            "update_status_url": reverse(
                "layers-clamp-to-terrain-status", kwargs={"pk": layer_id}
            ),
        }
    )
