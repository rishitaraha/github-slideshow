from io import BytesIO
from re import sub
from typing import Tuple

from django.utils.text import slugify as django_slugify
from PIL import Image, ImageOps


def resize_image(image, size: Tuple[int, int]):
    """
    Size should be a tuple of width and height, i.e. (width, height).
    """

    img = Image.open(image)
    if img.width > size[0] or img.height > size[1]:
        img.thumbnail(size)

    img_buffer = BytesIO()
    ImageOps.exif_transpose(img, in_place=True)
    img.save(img_buffer, format=img.format)
    img.close()
    return img_buffer.getvalue()


def make_alphanum(name):
    return "".join(character for character in name if character.isalnum())


def slugify(message: str) -> str:
    return "_".join(sub(r"(\s|_|-)+", " ", django_slugify(message)).split())
