from django.db.models import Count, Q
from django_softdelete.models import SoftDeleteManager


class GeotagImageModelManager(SoftDeleteManager):
    """
    Custom model manager for Geotag model.
    Returns: {
        total_images: int
        enabled_images: int
    }
    """

    def get_images_counts(
        self, *, iteration_dataset=None, merged_dataset=None
    ) -> dict[str, int]:
        return self.model.objects.filter(
            iteration_dataset=iteration_dataset,
            merged_dataset=merged_dataset,
            is_image_available=True,
        ).aggregate(
            total_images=Count("id"),
            enabled_images=Count("id", filter=Q(is_image_disabled=False)),
        )
