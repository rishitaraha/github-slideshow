from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from shared.helpers import get_object_with_uuid
from shared.serializers import UpdateFileStatusSerializer

from ..helpers import run_batch_job
from ..models import LayerFile


class LayerFileViewSet(ViewSet):
    permission_classes = (AllowAny,)

    def get_object(self, pk):
        return get_object_with_uuid(LayerFile, pk)

    @action(
        detail=True,
        methods=["patch"],
    )
    def status(self, request, pk=None):
        layer_file: LayerFile = self.get_object(pk)

        serializer = UpdateFileStatusSerializer(
            layer_file.file_info,
            data=request.data,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        run_batch_job(layer_file)

        response = {
            "message": f"{layer_file.file_info.name} status updated",
            "data": serializer.data,
        }
        return Response(response)
