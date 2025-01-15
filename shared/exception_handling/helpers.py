import json


class JSONCustomEncoder(json.JSONEncoder):
    def default(self, obj):
        return obj.__dict__


class ApiError:
    def __init__(self, message: str, slug: str):
        self.message = message
        self.slug = slug

    def __iter__(self):
        yield from {
            "message": self.message,
            "slug": self.slug,
        }.items()

    def __str__(self):
        return json.dumps(self, cls=JSONCustomEncoder)


class SlugMessageMaps:
    @classmethod
    def get(cls, slug: str, message: str) -> str:
        mapped_message = cls.data.get(slug)
        return mapped_message or message

    data = {
        "custom_user_with_this_email_already_exists": "A user with this email already exists",
        "the_fields_name_org_must_make_a_unique_set": "The name already exists for the organization",
        "the_fields_org_name_must_make_a_unique_set": "The name already exists for the organization",
        "ensure_this_field_has_no_more_than_50_characters": "Max 50 characters allowed",
    }
