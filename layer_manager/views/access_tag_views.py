from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from org_manager.validators import validate_org_ownership
from shared.helpers import get_object_with_uuid, paginate_data
from user_manager.permissions import IsOrgAdmin

from ..models import AccessTag
from ..serializers import AccessTagsSerializer


class AccessTagViewSet(viewsets.ViewSet):
    serializer_class = AccessTagsSerializer
    permission_classes = [IsOrgAdmin]

    def get_permissions(self):
        if self.action == "list":
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def get_queryset(self):
        return AccessTag.objects.get_access_tags_for_user(self.request.user).order_by(
            "-created_at"
        )

    def get_object(self, pk):
        access_tags = get_object_with_uuid(self.get_queryset(), id=pk)
        self.check_object_permissions(self.request, access_tags)
        return access_tags

    def list(self, request):
        access_tags = self.get_queryset().with_user_groups_count()
        if query := request.query_params.get("search"):
            access_tags = access_tags.search(query)

        page_number = request.GET.get("page")
        page_size = request.GET.get("page_size")

        access_tags, total_count = paginate_data(page_number, page_size, access_tags)

        serializer = self.serializer_class(access_tags, many=True)

        response = {
            "message": "Access Tags fetched successfully.",
            "data": {
                "access_tags": serializer.data,
                "total": total_count,
            },
        }
        return Response(response)

    def create(self, request):
        access_tag_data = request.data.copy()
        access_tag_data["org"] = request.user.org.id
        serializer = self.serializer_class(data=access_tag_data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": f"{serializer.data['name']} tag added successfully to Access Tags.",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        data = request.data.copy()
        access_tag = self.get_object(pk)
        validate_org_ownership(request, access_tag, raise_exception=True)
        serializer = self.serializer_class(access_tag, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Access Tag updated successfully.",
            "data": serializer.data,
        }
        return Response(response)

    def destroy(self, request, pk=None):
        access_tag = self.get_object(pk)
        validate_org_ownership(request, access_tag, raise_exception=True)
        access_tag.delete()
        response = {
            "message": "Access Tag deleted successfully.",
        }
        return Response(response)
