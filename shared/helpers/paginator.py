from typing import Iterable, Union

from django.core.paginator import Paginator
from django.db.models import QuerySet


# Paginate list if page_number and page_size is there else return full list.
def paginate_data(
    page_number: Union[str, int, None],
    page_size: Union[str, int, None],
    objects: QuerySet,
) -> Iterable:
    """
    Makes the list/queryset of objects paginated.
    """
    if page_number and page_size:
        paginator = Paginator(objects, page_size)
        return paginator.page(page_number), paginator.count
    else:
        return objects, objects.count()
