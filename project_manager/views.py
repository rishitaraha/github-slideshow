from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from org_manager.helpers import get_current_org
from org_manager.permissions import HasOrgAccessToken
from shared.helpers import get_object_with_uuid
from user_manager.permissions import IsOrgAdmin

from .models import Project, ProjectPermission
from .permissions import HasViewProjectPermission
from .serializers import (
    ProjectPermissionSerializer,
    ProjectSerializer,
    RetrieveProjectSerializer,
    UpdateProjectSerializer,
)


class ProjectViewSet(viewsets.ViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsOrgAdmin]

    def get_queryset(self):
        org = get_current_org(self.request)
        projects = Project.objects.filter(org=org).order_by("created_at")
        return projects

    def get_permissions(self):
        if self.action == "list":
            self.permission_classes = [IsAuthenticated | HasOrgAccessToken]
        elif self.action == "retrieve":
            self.permission_classes = [HasViewProjectPermission]
        return super(ProjectViewSet, self).get_permissions()

    def get_object(self, pk=None):
        project = get_object_with_uuid(self.get_queryset(), id=pk)
        self.check_object_permissions(self.request, project)
        return project

    def list(self, request):
        if request.user.is_authenticated:
            projects = (
                Project.objects.get_projects_for_user(request.user)
                .with_site_count()
                .order_by("created_at")
            )
        else:
            projects = self.get_queryset().with_site_count()

        search_param = request.query_params.get("search")
        if search_param:
            projects = projects.filter(name__icontains=search_param)

        serializer = self.serializer_class(projects, many=True)
        response = {
            "message": "Projects fetched successfully.",
            "data": {"projects": serializer.data, "total": projects.count()},
        }
        return Response(response)

    def create(self, request):
        data = request.data.copy()
        data["org"] = request.user.org.id
        serializer = self.serializer_class(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Project created successfully.",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        project = self.get_object(pk)
        serializer = RetrieveProjectSerializer(project)
        response = {
            "message": "Project fetched successfully.",
            "data": serializer.data,
        }
        return Response(response)

    def partial_update(self, request, pk=None):
        project = self.get_object(pk)
        serializer = UpdateProjectSerializer(project, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Project updated successfully.",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=True,
        methods=["post"],
        serializer_class=ProjectPermissionSerializer,
    )
    def permission(self, request, pk=None):
        data = request.data.copy()
        data["project"] = pk
        user_group_id = data["user_group"]
        project_permission = ProjectPermission.objects.filter(
            project_id=pk, user_group_id=user_group_id
        ).first()
        if project_permission:
            serializer = self.serializer_class(
                project_permission,
                data=data,
                partial=True,
                context={"request": request},
            )
        else:
            serializer = self.serializer_class(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": f"Project permission {'updated' if project_permission else 'created'} successfully.",
            "data": serializer.data,
        }
        return Response(response)
