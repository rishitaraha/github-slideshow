import { FileFormat } from '../enums';

export const FileFormatByExtension = {
  '.mbtiles': FileFormat.MBTiles,
  '.tif': FileFormat.GeoTIFF,
  '.tiff': FileFormat.GeoTIFF,
  '.gpkg': FileFormat.GPKG,
  '.dxf': FileFormat.DXF,
};
