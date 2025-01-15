export enum MultipartErrorType {
  CancelledByUser = 'cancelledByUser',
  FileUploadError = 'fileUploadError',
}

export enum MultipartErrorMessage {
  CancelledByUser = 'File upload cancelled by user',
  FileUploadError = 'File upload failed. Try again',
}

export enum FileType {
  BaseDsm = 'base_dsm',
  CapturedDsm = 'captured_dsm',
  LegendImage = 'legend_image',
  Orthomosaic = 'orthomosaic',
  OrthomosaicCog = 'orthomosaic_cog',
  MBTiles = 'mbtiles',
  CapturedDsmCog = 'captured_dsm_cog',
  Vectors = 'vectors',
  VectorTiles = 'vector_tiles',
  SlopeMap = 'slope_map',
  Temporary = 'temporary',
}
