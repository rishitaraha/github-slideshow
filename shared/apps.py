from django.apps import AppConfig


class SharedConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "shared"

    def ready(self) -> None:
        # Ref: https://docs.djangoproject.com/en/4.1/topics/signals/#:~:text=Django%20includes%20a%20%E2%80%9Csignal%20dispatcher,some%20action%20has%20taken%20place.
        from . import signals  # isort: skip

        return super().ready()
