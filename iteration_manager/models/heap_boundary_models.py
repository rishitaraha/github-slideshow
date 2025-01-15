from uuid import uuid4

from django.contrib.gis.db import models as gismodels
from django.db import models
from rest_framework.exceptions import ValidationError

from shared.exception_handling import ValidationErrors
from shared.models import BaseModel

from ..constants import BaseReference, HeapCategory, HeapMaterialTypes
from .iteration_models import Iteration


class HeapBoundary(BaseModel):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid4)
    name = models.CharField(max_length=200)
    iteration = models.ForeignKey(
        Iteration, on_delete=models.CASCADE, related_name="heaps"
    )
    geometry = gismodels.MultiPolygonField()

    base_reference = models.CharField(
        choices=BaseReference.choices(),
        max_length=100,
        default=BaseReference.VisibleGround.value,
    )
    base_iteration = models.ForeignKey(
        Iteration,
        on_delete=models.DO_NOTHING,
        null=True,
    )

    remarks = models.CharField(max_length=200, null=True)
    centroid = models.CharField(max_length=50, null=True)
    bulk_density = models.FloatField(null=True)
    cut_volume = models.DecimalField(null=True, max_digits=19, decimal_places=4)
    fill_volume = models.DecimalField(null=True, max_digits=19, decimal_places=4)
    net_volume = models.DecimalField(null=True, max_digits=19, decimal_places=4)
    cut_weight = models.DecimalField(null=True, max_digits=19, decimal_places=4)
    fill_weight = models.DecimalField(null=True, max_digits=19, decimal_places=4)
    net_weight = models.DecimalField(null=True, max_digits=19, decimal_places=4)
    material_type = models.CharField(
        choices=HeapMaterialTypes.choices(),
        max_length=50,
        default=HeapMaterialTypes.Other.value,
    )
    included_in_kpi = models.BooleanField(default=False)
    category = models.CharField(
        choices=HeapCategory.choices(),
        max_length=50,
        default=HeapCategory.OTHER.value,
    )

    def save(self, *args, **kwargs):
        self.clean()
        self.centroid = f"{self.geometry.centroid.x} {self.geometry.centroid.y}"
        super().save(*args, **kwargs)

    def clean(self):
        # base_iteration will be required when other_iteration_dsm is selected as base reference.
        if (
            self.base_reference == BaseReference.OtherIterationDsm.value
            and self.base_iteration is None
        ):
            raise ValidationError(
                ValidationErrors.BASE_ITERATION_IS_REQUIRED_FOR_HEAP.value
            )

        return super().clean()
