import string

from django.db import models
from nanoid import generate


class WorkspaceManager(models.Manager):
    def create(self, **kwargs):
        if "slug" not in kwargs or not kwargs["slug"]:
            kwargs["slug"] = self.generate_unique_slug()
        return super().create(**kwargs)

    def generate_unique_slug(self):
        alphabet = string.ascii_letters + string.digits
        while True:
            slug = generate(alphabet, 8)
            if not self.model.objects.filter(slug=slug).exists():
                return slug
