export enum LayerResponseType {
  Vector = 'vector',
  Orthomosaic = 'orthomosaic',
  MBTiles = 'mbtiles',
  MapBox = 'mapbox',
  Cesium = 'cesium',
  Contour = 'contour',
  SlopeMap = 'slope_map',
}

export enum LayerType {
  Vector = 'vector',
  Orthomosaic = 'orthomosaic',
  CapturedDsm = 'capturedDsm',
  MBTiles = 'mbtiles',
  MapBox = 'mapbox',
  Cesium = 'cesium',
  Contour = 'contour',
  SlopeMap = 'slopeMap',
}

export enum AreaCategory {
  Other = 'other',
  PlannedAndActive = 'planned_and_active',
  PlannedAndInactive = 'planned_and_inactive',
  UnplannedAndActive = 'unplanned_and_active',
  UnplannedAndActiveBeyondCriticalBoundary = 'unplanned_and_active_beyond_critical_boundary',
}

export enum LayerQueryKey {
  Layers = 'layers',
}

export enum VectorFileFormat {
  ShapeFile = 'shp',
  DXF = 'dxf',
  KML = 'kml',
}
