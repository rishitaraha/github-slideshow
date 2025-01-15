from django.contrib import admin
from django.contrib.auth.models import Group
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)

# Removing the default registered models.
admin.site.unregister([Group, BlacklistedToken, OutstandingToken])
