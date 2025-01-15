from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.response import Response

from shared.helpers import get_object_with_uuid, paginate_data

from ..models import UserGroup
from ..permissions import IsOrgAdmin
from ..serializers import (
    AddUserGroupSerializer,
    UserGroupListSerializer,
    UserGroupSerializer,
)


class UserGroupViewSet(viewsets.ViewSet):
    serializer_class = UserGroupSerializer
    permission_classes = [IsOrgAdmin]

    def get_queryset(self):
        return UserGroup.objects.filter(org=self.request.user.org)

    def get_object(self, pk=None):
        user_group = get_object_with_uuid(self.get_queryset(), id=pk)
        # Calls has_object_permission() from permission class.
        self.check_object_permissions(self.request, user_group)
        return user_group

    def create(self, request):
        data = request.data.copy()
        data["org"] = request.user.org.id
        serializer = AddUserGroupSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "User Group created successfully.",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        user_group = self.get_object(pk)
        serializer = self.serializer_class(user_group)
        response = {
            "message": "User Group fetched successfully.",
            "data": serializer.data,
        }
        return Response(response)

    def list(self, request):
        user_groups = self.get_queryset()

        if query := self.request.query_params.get("search"):
            user_groups = user_groups.filter(name__icontains=query)

        # Set Members count of each user group.
        user_groups = user_groups.annotate(members_count=Count("users"))

        page_number = request.GET.get("page")
        page_size = request.GET.get("page_size")

        user_groups, total_count = paginate_data(page_number, page_size, user_groups)

        serializer = UserGroupListSerializer(user_groups, many=True)

        response = {
            "message": "User groups fetched successfully.",
            "data": {
                "user_groups": serializer.data,
                "total": total_count,
            },
        }
        return Response(response)

    def partial_update(self, request, pk=None):
        user_group = self.get_object(pk)
        data = request.data
        serializer = self.serializer_class(user_group, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "User group updated successfully.",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_200_OK)

    def destroy(self, request, pk=None):
        user_group = self.get_object(pk)
        user_group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
