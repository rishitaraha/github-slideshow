from django.contrib.auth.forms import BaseUserCreationForm

from user_manager.constants import UserType


class CreateUserForm(BaseUserCreationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Making org optional.
        self.fields["org"].required = False

    def clean(self):
        cleaned_data = super().clean()
        org = cleaned_data.get("org")
        user_type = cleaned_data.get("type")

        if user_type in [UserType.ORG_ADMIN.value, UserType.MEMBER.value] and not org:
            self.add_error("org", "This field is required.")

        if user_type == UserType.SUPPORT.value and org:
            self.add_error("org", "Support users cannot have an organisation.")
