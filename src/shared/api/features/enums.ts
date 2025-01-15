/**
 * @FIXME - https://aarav-unmanned-systems.atlassian.net/browse/RAIN-4259?atlOrigin=eyJpIjoiOGRkZGMwYmU5YzdjNDJmZmExYjVjYWIwMGI0ZGQxN2IiLCJwIjoiaiJ9
 * either fix the responses from BE or update the mappers in FE and keep only a single type
 * i.e. FeatureGeometryType or FeatureType enum
 */
export enum FeatureGeometryType {
  Line = 'lines',
  Polygon = 'polygons',
  Textbox = 'textbox',
  Point = 'points',
}
