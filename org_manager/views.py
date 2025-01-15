from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from shared.helpers import get_object_with_uuid
from user_manager.permissions import IsOrgAdmin, IsSupportUser

from .models import Organisation
from .serializers import GetMyOrgSerializer, OrgSerializer, UploadLogoSerializer


class OrganisationViewSet(ViewSet):
    serializer_class = OrgSerializer
    permission_classes = [IsSupportUser]

    def get_queryset(self):
        return Organisation.objects.all()

    def get_object(self, pk=None):
        org = get_object_with_uuid(self.get_queryset(), id=pk)
        self.check_object_permissions(self.request, org)
        return org

    def list(self, request):
        organisations = self.get_queryset()

        # Search.
        search_param = request.query_params.get("search")
        if search_param:
            organisations = organisations.filter(name__icontains=search_param)

        serializer = self.serializer_class(organisations, many=True)
        response = {
            "message": "Organisations fetched successfully.",
            "data": {
                "organisations": serializer.data,
                "total": organisations.count(),
            },
        }
        return Response(response)

    def retrieve(self, request, pk=None):
        org = self.get_object(pk)
        serializer = self.serializer_class(org)
        response = {
            "message": "Organisation fetched successfully.",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated],
        serializer_class=GetMyOrgSerializer,
        url_path="my-org",
    )
    def my_org(self, request):
        org = request.user.org
        serializer = self.serializer_class(org)
        response = {
            "message": "Organisation fetched successfully.",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[IsOrgAdmin],
        serializer_class=UploadLogoSerializer,
    )
    def logo(self, request):
        org = request.user.org
        self.check_object_permissions(request, org)
        serializer = self.serializer_class(org, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        my_org_serializer = GetMyOrgSerializer(org)

        response = {
            "message": "Logo uploaded successfully.",
            "data": my_org_serializer.data,
        }
        return Response(response)
