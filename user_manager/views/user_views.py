from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from shared.helpers import get_object_with_uuid, paginate_data, unwrap_boolean

from ..models import CustomUser
from ..permissions import IsOrgAdmin, IsSelf
from ..serializers import (
    ChangePasswordSerializer,
    LoggedUserSerializer,
    UserSelfUpdateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


class UserViewSet(viewsets.ViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsOrgAdmin]

    def get_permissions(self):
        if self.action in ["change_password", "partial_update"]:
            self.permission_classes = [IsOrgAdmin | IsSelf]
        return super(UserViewSet, self).get_permissions()

    def get_queryset(self):
        return CustomUser.objects.filter(org=self.request.user.org).order_by(
            "-created_at"
        )

    def get_object(self, pk):
        user = get_object_with_uuid(self.get_queryset(), id=pk)
        # Calls has_object_permission() from permission class.
        self.check_object_permissions(self.request, user)
        return user

    def list(self, request):
        users = self.get_queryset()

        # Search Query for users
        if query := self.request.query_params.get("search"):
            users = users.search(query)

        # Filter query to send only active or only inactive users.
        deactivated_users = self.request.query_params.get("deactivated_users")
        if deactivated_users:
            is_active = not unwrap_boolean(deactivated_users)
            users = users.with_active(is_active)

        # Filter query to send only org members.
        members_only = self.request.query_params.get("members_only")
        if members_only and unwrap_boolean(members_only):
            users = users.get_only_members()

        # Pagination params.
        page_number = request.GET.get("page")
        page_size = request.GET.get("page_size")

        paginated_data, total_count = paginate_data(page_number, page_size, users)
        serializer = self.serializer_class(paginated_data, many=True)

        response = {
            "message": "Users fetched successfully.",
            "data": {"users": serializer.data, "total": total_count},
        }
        return Response(response)

    def create(self, request):
        data = request.data.copy()
        data["org"] = request.user.org.id
        serializer = self.serializer_class(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Users created successfully.",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        user = self.get_object(pk)
        serializer = self.serializer_class(user)
        response = {
            "message": "User fetched successfully.",
            "data": serializer.data,
        }
        return Response(response)

    @action(detail=False, methods=["get"], permission_classes=[IsSelf])
    def logged(self, request):
        user = request.user
        serializer = LoggedUserSerializer(user)
        response = {
            "message": "Logged user fetched successfully.",
            "data": serializer.data,
        }
        return Response(response)

    def partial_update(self, request, pk=None):
        user = self.get_object(pk)
        data = request.data.copy()
        if user == request.user:
            serializer_class = UserSelfUpdateSerializer
        else:
            serializer_class = UserUpdateSerializer
        serializer = serializer_class(user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # When a user is made inactive, it is removed from all User Groups.
        if not user.is_active:
            user.groups.clear()

        response = {
            "message": "User updated successfully.",
            "data": serializer.data,
        }
        return Response(response)

    @action(detail=False, methods=["patch"], url_path="change-password")
    def change_password(self, request):
        if user_id := request.data.get("user_id", None):
            user = self.get_object(user_id)
        else:
            user = request.user
        serializer = ChangePasswordSerializer(user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Password changed successfully.",
        }
        return Response(response)
