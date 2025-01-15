import os
from typing import Literal
from unittest.mock import AsyncMock, MagicMock

from rio_tiler.io import COGReader

from . import TEST_DIR_PATH


# AWS Manager mocks.
class MockedS3Client:
    def generate_presigned_url(self, *args, **kwargs):
        return "presigned_url"


class MockedAwsManager:
    s3client = MockedS3Client()

    @classmethod
    def get_file(cls, type: Literal["tile", "terrain_metadata"] = "tile"):
        if type == "terrain_metadata":
            return b'{\n  "tilejson": "2.1.0",\n  "name": "0cb0458a-7365-408a-8f91-8897e020800c",\n  "description": "",\n  "version": "1.1.0",\n  "format": "quantized-mesh-1.0",\n  "attribution": "",\n  "schema": "tms",\n  "extensions": [ "octvertexnormals" ],\n  "tiles": [ "{z}/{x}/{y}.terrain?v={version}" ],\n  "projection": "EPSG:4326",\n  "bounds": [ 0.00, -90.00, 180.00, 90.00 ],\n  "available": [\n    [ { "startX": 0, "startY": 0, "endX": 1, "endY": 0 } ]\n   ,[ { "startX": 2, "startY": 1, "endX": 2, "endY": 1 } ]\n   ,[ { "startX": 5, "startY": 2, "endX": 5, "endY": 2 } ]\n   ,[ { "startX": 11, "startY": 5, "endX": 11, "endY": 5 } ]\n   ,[ { "startX": 23, "startY": 10, "endX": 23, "endY": 10 } ]\n   ,[ { "startX": 47, "startY": 20, "endX": 47, "endY": 20 } ]\n   ,[ { "startX": 94, "startY": 40, "endX": 94, "endY": 40 } ]\n   ,[ { "startX": 188, "startY": 80, "endX": 188, "endY": 80 } ]\n   ,[ { "startX": 377, "startY": 161, "endX": 377, "endY": 161 } ]\n   ,[ { "startX": 755, "startY": 323, "endX": 755, "endY": 323 } ]\n   ,[ { "startX": 1510, "startY": 647, "endX": 1510, "endY": 647 } ]\n   ,[ { "startX": 3021, "startY": 1294, "endX": 3021, "endY": 1294 } ]\n   ,[ { "startX": 6042, "startY": 2589, "endX": 6043, "endY": 2589 } ]\n   ,[ { "startX": 12085, "startY": 5178, "endX": 12086, "endY": 5178 } ]\n   ,[ { "startX": 24171, "startY": 10356, "endX": 24172, "endY": 10356 } ]\n   ,[ { "startX": 48343, "startY": 20712, "endX": 48344, "endY": 20713 } ]\n   ,[ { "startX": 96686, "startY": 41424, "endX": 96689, "endY": 41426 } ]\n   ,[ { "startX": 193372, "startY": 82848, "endX": 193379, "endY": 82853 } ]\n   ,[ { "startX": 386744, "startY": 165697, "endX": 386759, "endY": 165707 } ]\n   ,[ { "startX": 773488, "startY": 331395, "endX": 773518, "endY": 331414 } ]\n   ,[ { "startX": 1546977, "startY": 662791, "endX": 1547036, "endY": 662829 } ]\n   ,[ { "startX": 3093954, "startY": 1325583, "endX": 3094072, "endY": 1325658 } ]\n  ]\n}\n'

        return b'\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\x03\x1d\x90OH\xd3q\x18\xc6\xf7yg\xcd\rr\xb2\x84d`\xacQ\xb9\x18\x06\xd1_\xa1\x90Z\xa4\xcc\x0c"*A\xb71t\xe2\x96m"\xbfF6\x04\xfb\'*%L\xda\xf6k\x05]\xd6\xa5C\xd8\xa5\xdao_"\x82\x84\xc2C\x9d\x82\x88N\x1e:t\x88\x9d\xc2C\xf6\x9d\xb7\x87\x07\xde\xe7y?\x8f\xb7\xd0\xe4r\x8cd\xd2F\xe6\xc6\x94\xe7\x1d\x9e\xed6\x1b\x88\xb4\x8b\xff\x15\xceg\xd4w}\xb6\x8f\xed0\xc5\xf9\x97v\x8b\x80bo\x05\x9b\xc5\x1e\xc5\xc8\nC\x16I\x8b\xfe\r\x8e\x9a\xe2\xfd\xc9I\x8bp\xaa\xd9\xe4\x94\x91y\xc9s\xb23\x15\x1e\xa2\x88\xfd#T\x14\xd7\x06a\x8b\xe1"s\x8c)\x8e\xdc\x91\xe3\xf3\x12W\xe4\xb9U\xe5\xcc&\xe7Jr\xb0 -%i\xfeJ[\x95p\x8d\x0b\x9b\x9c-\xc9\xee\x92\xb4\x96\xb6\xfcO\xb4T\x89\xc6\xc7\x16\xb0\x88\xcc\xe9|\xc5L\xaaF\x91\x05\xa2U\xb4\xea\x0b\xf9<K\xa2\x01\xec4m\x01\xdc\x16\r\xf0\xc3]\xd7\x07\xd7V\xb9\xba\xc6%\x8bn\x8b\xe0\xbc\xf4\x16\xa5\xc7\x94}\xa68L\xe1\x0bnE\xf05\xf1\n1En\x91\x88\xc5\xb4&\xfb@D\xd1o\xd1\xf9\x8b\x9d\xa6t\x14%h\xca\x81?\x1cR\x9c\x9e\xcc\x9d\xaf\xb1\xff.\xce\xa2\xcb\xb6lw\xb6v*l\xef\xb9\xa20fu\xd9\x12\x8f\x88.R\xc6\xb7\x8a\x94\xa5\xabN\x97\xc5aE\xcf:\x03\xeb<\xe1)\xdf\x18\xfc\xc8\xb1\x1a\xc3\x99\xd1\x06\xce\xe5\xeft\x97\xc5Q\x966S\xdc\xcb\xa2\xc7\r)\x86^p\x9f\xc6@\xf7\x1a[\xe6\x19\xafi\x95\x8b\xe6Ya`\r\xfd~GY\xdc\xbf\xd1\xd5\tE\xe4\x01\x8fuPl\xbcJ\x85Bc\x90\xec\x1b\x8c\x8b\'\xbc\x92\x1c\xf5:\x13\x13\x89l\xdcHf\xd2^\xe7D2\x9d\x88\x19\xd3\x93\t\xbf=\xf0\x16\xbf\x04\xfa\xfc\x0e\xd7\xb6\xeb\xf1TfJ;\x15\xbbvz\x03\xb3\xbe\x9b\xf2\x1fGK\xfa\x03\x18\x02\x00\x00'


# AioHTTPClient mocks.
class MockedAioHttpClient:
    @classmethod
    def post(cls):
        response = AsyncMock()
        response.status = 200
        return response


# Cog reader mocks.
class MockCOGReader(MagicMock):
    tif_file_path = os.path.join(TEST_DIR_PATH, "fixtures", "cog.tif")

    def tile(self, *args, **kwargs):
        X, Y, Z = 43, 24, 7
        with COGReader(self.tif_file_path) as cog:
            return cog.tile(X, Y, Z)

    def point(self, *args, **kwargs):
        with COGReader(self.tif_file_path) as cog:
            return cog.point(-58.678126, 73.085427)
