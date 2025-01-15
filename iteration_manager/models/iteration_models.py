from uuid import uuid4

from django.db import models
from django_softdelete.models import DeletedManager, SoftDeleteManager, SoftDeleteModel
from rest_framework.exceptions import NotFound

from shared.exception_handling import ApiErrors
from shared.models import BaseModel, BatchJob, FileInfo
from site_manager.models import Site


class Iteration(BaseModel, SoftDeleteModel):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid4)
    site = models.ForeignKey(Site, on_delete=models.DO_NOTHING)
    name = models.CharField(max_length=200)
    date = models.DateField()
    info = models.TextField(null=True, blank=True)
    captured_dsm = models.ForeignKey(
        FileInfo,
        on_delete=models.DO_NOTHING,
        null=True,
        related_name="captured_dsm_iteration",
    )
    captured_dsm_cog = models.ForeignKey(
        FileInfo,
        on_delete=models.DO_NOTHING,
        null=True,
        related_name="captured_dsm_cog_iteration",
    )
    terrain_tiles = models.ForeignKey(
        BatchJob,
        on_delete=models.DO_NOTHING,
        null=True,
        related_name="terrain_iteration",
    )

    # Managers.
    objects = SoftDeleteManager()
    deleted_objects = DeletedManager()

    def get_dsm_or_404(self) -> FileInfo:
        if not self.captured_dsm or self.captured_dsm.is_deleted:
            api_error_obj = ApiErrors.DSM_NOT_FOUND.value
            api_error_obj.message = f"DSM not present for {self.name}"
            raise NotFound(api_error_obj)

        return self.captured_dsm
