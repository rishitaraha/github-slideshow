export enum FileStatus {
  Importing = 'importing',
  ImportFailed = 'import_failed',
  Starting = 'started',
  Processing = 'processing',
  Done = 'done',
  Failed = 'failed',
}

export enum BatchJobStatus {
  Started = 'started',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export enum FileFormat {
  MBTiles = 'mbtiles',
  GeoTIFF = 'geotiff',
  DXF = 'dxf',
  KML = 'kml',
  GPKG = 'gpkg',
}

export enum FileExtension {
  MBTiles = '.mbtiles',
  CSV = '.csv',
  ZIP = '.zip',
  GeoTIFF = '.tif',
  DXF = '.dxf',
  KML = '.kml',
  GPKG = '.gpkg',
}
