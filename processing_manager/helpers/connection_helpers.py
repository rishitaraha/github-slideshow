from ..models import Connection


def is_connected_to_processing(org_id: str):
    return Connection.objects.filter(org=org_id).exists()
