import os
from enum import Enum


class FilePath(Enum):
    BASE_DIR = os.path.abspath(os.curdir)
    FILE_DIR = os.path.join(BASE_DIR, "files")
