from typing import Type, TypeVar

from django.db.models import Model
from django.http import HttpRequest
from rest_framework.exceptions import NotFound

from iteration_manager.models import HeapBoundary, Iteration
from layer_manager.models import AccessTag, Feature, Layer
from processing_manager.models import Connection as ProcessingConnection
from project_manager.models import Project, ProjectPermission
from site_manager.models import Site, SiteKPI, SitePermission
from user_manager.models import CustomUser, UserGroup

from .helpers import get_current_org
from .models import Organisation, OrganisationAccessToken

ModelInstanceType = TypeVar("ModelInstanceType", bound=Model)

# Dict of models and functions which returns the org of passed model instance.
FETCH_ORG_FUNCTIONS = {
    # Org manager models.
    Organisation: lambda org: org,
    OrganisationAccessToken: lambda org_access_token: org_access_token.org,
    # User manager models.
    CustomUser: lambda user: user.org,
    UserGroup: lambda user_group: user_group.org,
    # Project manager models.
    Project: lambda project: project.org,
    ProjectPermission: lambda project_permission: project_permission.project.org,
    # Site manager models.
    Site: lambda site: site.project.org,
    SitePermission: lambda site_permission: site_permission.project.org,
    SiteKPI: lambda site_kpi: site_kpi.site.project.org,
    # Iteration manager models.
    Iteration: lambda iteration: iteration.site.project.org,
    HeapBoundary: lambda heap: heap.iteration.site.project.org,
    # Layer manager models.
    Layer: lambda layer: layer.site.project.org,
    AccessTag: lambda access_tag: access_tag.org,
    Feature: lambda feature: feature.layer.site.project.org,
    # Processing manager models.
    ProcessingConnection: lambda processing_connection: processing_connection.org,
}


def is_object_in_same_org(
    request: HttpRequest, model_instance: Type[ModelInstanceType]
):
    """
    Returns True if passed model instance lies inside the current/logged org.
    """

    current_org = get_current_org(request)

    get_org_function = FETCH_ORG_FUNCTIONS.get(model_instance.__class__)

    if get_org_function and current_org == get_org_function(model_instance):
        return True

    return False


def validate_org_ownership(
    request: HttpRequest, model_instance: Type[ModelInstanceType], raise_exception=False
):
    if not is_object_in_same_org(request, model_instance):
        if raise_exception:
            raise NotFound
        return False

    return True
