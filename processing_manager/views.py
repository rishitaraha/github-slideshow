from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iteration_manager.models import Iteration
from layer_manager.constants import LayerType
from layer_manager.helpers import import_dsm, import_orthomosaic_as_layer
from layer_manager.models import Layer
from org_manager.permissions import IsFeatureFlagEnabled
from processing_manager.models import Connection
from rainbow import logger
from shared.exception_handling import ApiErrors, GeneralException
from shared.helpers import get_object_with_uuid
from user_manager.permissions import IsOrgAdmin

from .processing_api import apis
from .serializers import (
    ConnectionSerializer,
    ProcessingExportSerializer,
    ProcessingSerializer,
)


class ProcessingViewSet(ViewSet):
    serializer_class = ProcessingSerializer
    permission_classes = [IsOrgAdmin, IsFeatureFlagEnabled]

    def get_queryset(self):
        return Connection.objects.filter(org=self.request.user.org)

    @action(detail=False, methods=["post"], url_path="connect", url_name="connect")
    def connect(self, request):
        analytics_org = request.user.org
        serializer = ConnectionSerializer(
            data=request.data,
            context={"logged_user_org": request.user.org},
        )
        serializer.is_valid(raise_exception=True)

        # Call to create connection api of processing server.
        processing_org_id = serializer.validated_data.get("processing_org_id")
        processing_connect_request_body = {
            "ra_org_id": str(analytics_org.id),
            "ra_org_name": analytics_org.name,
            "connection_token": serializer.validated_data.get("connection_token"),
        }

        try:
            response_data, _ = apis.connect(
                processing_org_id, processing_connect_request_body
            )

            if processing_org_name := response_data.get("rp_org_name"):
                # Save connection object.
                connection_obj: Connection = serializer.save()
                connection_obj.processing_org_name = processing_org_name
                connection_obj.save()

                response = {
                    "message": f"Connection established successfully",
                    "data": {
                        **serializer.data,
                        "processing_org_name": processing_org_name,
                        "connection_id": connection_obj.id,
                    },
                }
            else:
                raise GeneralException(
                    ApiErrors.INVALID_RESPONSE.value,
                )
        except Exception as e:
            logger.exception(e)
            raise GeneralException(
                ApiErrors.PROCESSING_CONNECTION_FAILED.value,
            )

        return Response(response, status=status.HTTP_201_CREATED)

    @action(
        detail=False,
        methods=["delete"],
        url_path="disconnect",
        url_name="disconnect",
    )
    def disconnect(self, request):
        connection_obj = self.get_queryset().first()
        if connection_obj is None:
            raise NotFound(ApiErrors.NOTHING_TO_DISCONNECT.value)

        # Call to disconnect api of processing server.
        try:
            _, status_code = apis.disconnect(
                connection_obj.processing_org_id,
            )

            if status_code == status.HTTP_200_OK:
                connection_obj.delete()
                response = {
                    "message": "Disconnected from Processing",
                }
                return Response(response, status=status.HTTP_205_RESET_CONTENT)

        except Exception as e:
            logger.exception(e)
            raise GeneralException(
                ApiErrors.PROCESSING_DISCONNECTION_FAILED.value,
            )

    @action(
        detail=False,
        methods=["get"],
        url_path="connection",
        url_name="connection",
        permission_classes=[IsFeatureFlagEnabled],
    )
    def connection(self, request):
        connection_obj = self.get_queryset().first()
        if connection_obj is None:
            raise NotFound(ApiErrors.OBJECT_NOT_FOUND.value)
        serializer = ConnectionSerializer(connection_obj)
        response = {
            "message": "Connections fetched successfully",
            "data": serializer.data,
        }
        return Response(response)

    @action(detail=False, methods=["post"], url_path="org", url_name="org")
    def create_processing_org(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            create_org_request_body = {
                "name": serializer.validated_data.get("processing_org_name"),
            }

            # Api call to processing application, to create processing org.
            create_org_response_data, _ = apis.create_org(create_org_request_body)

            processing_org_id = create_org_response_data.get("id")

            if not processing_org_id:
                raise GeneralException(ApiErrors.INVALID_RESPONSE.value)

            # Api call to create connection token.
            token_response_data, _ = apis.generate_token(processing_org_id)

            connection_token = token_response_data.get("connection_token")

            if not connection_token:
                raise GeneralException(ApiErrors.INVALID_RESPONSE.value)

            # Api call to connect to processing application.
            analytics_org = request.user.org

            connect_request_body = {
                "ra_org_id": str(analytics_org.id),
                "ra_org_name": analytics_org.name,
                "connection_token": connection_token,
            }

            connect_response_data, _ = apis.connect(
                processing_org_id, connect_request_body
            )

            processing_org_name = connect_response_data.get("rp_org_name")

            if not processing_org_name:
                raise GeneralException(ApiErrors.INVALID_RESPONSE.value)

            # Create connection record after successful connection.
            connection_obj: Connection = Connection(
                org=analytics_org,
                processing_org_name=processing_org_name,
                connection_token=connection_token,
                processing_org_id=str(processing_org_id),
            )
            connection_obj.save()

            response = {
                "message": f"Processing org created and Connection established successfully",
                "data": {
                    "processing_org_id": processing_org_id,
                    "processing_org_name": processing_org_name,
                    "connection_token": connection_obj.connection_token,
                },
            }

        except Exception as e:
            logger.exception(e)
            raise GeneralException(ApiErrors.PROCESSING_CONNECTION_FAILED.value)

        return Response(response, status=status.HTTP_201_CREATED)

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[IsFeatureFlagEnabled],
    )
    def export(self, request):
        serializer = ProcessingExportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        iteration: Iteration = get_object_with_uuid(
            Iteration, str(data["iteration_id"])
        )

        org = request.user.org

        if dsm_s3_file := data.get("dsm"):
            # TODO: Need to refactor this in DSM as layer.
            import_dsm(iteration, dsm_s3_file["bucket"], dsm_s3_file["key"], org)

        if orthomosaic_s3_file := data.get("orthomosaic"):
            layer = Layer.objects.create(
                name=data["ortho_layer_name"],
                type=LayerType.ORTHOMOSAIC.value,
                iteration=iteration,
                site=iteration.site,
            )

            import_orthomosaic_as_layer(
                new_layer=layer,
                source_bucket_name=orthomosaic_s3_file["bucket"],
                source_file_s3_key=orthomosaic_s3_file["key"],
                org=org,
            )

        return Response(
            {"message": "Export started successfully"},
            status=status.HTTP_202_ACCEPTED,
        )
