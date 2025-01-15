from django.db import models

from iteration_manager.models import Iteration
from layer_manager.models import Layer
from shared.models import BaseModel, BatchJob
from user_manager.models import CustomUser
from workspace_manager.constants import SmartDetectType


class SmartDetect(BaseModel):
    iteration = models.ForeignKey(
        Iteration, on_delete=models.DO_NOTHING, related_name="smart_detects"
    )
    input_ortho_layer = models.ForeignKey(Layer, on_delete=models.DO_NOTHING)
    created_by = models.ForeignKey(
        CustomUser, on_delete=models.DO_NOTHING, related_name="created_smart_detect"
    )
    updated_by = models.ForeignKey(
        CustomUser, on_delete=models.DO_NOTHING, related_name="updated_smart_detect"
    )

    def get_outputs(self):
        """Fetch all SmartDetectOutput objects for this SmartDetect."""
        return self.smartdetectoutput_set.prefetch_related("layers")


class SmartDetectOutput(BaseModel):
    smart_detect = models.ForeignKey(SmartDetect, on_delete=models.DO_NOTHING)
    layers = models.ManyToManyField(Layer, related_name="smart_detect_layers")
    type = models.TextField(choices=SmartDetectType.choices(), max_length=255)
    batch_job = models.ForeignKey(BatchJob, on_delete=models.DO_NOTHING, null=True)

    def get_related_layers(self):
        """Fetch all related layers for this output."""
        return self.layers.all()
