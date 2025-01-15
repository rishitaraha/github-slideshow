import enum


class UserType(enum.Enum):
    SUPPORT = "support"
    ORG_ADMIN = "org_admin"
    MEMBER = "member"

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]

    @classmethod
    def org_admin_choices(cls):
        return [
            (key.value, key.name)
            for key in filter(lambda x: x.value != cls.SUPPORT.value, cls)
        ]
