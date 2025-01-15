import { GeotagSchemaField } from '../enums';

export const swapFieldsToGeographicCrs = (columnValue) => {
  switch (columnValue) {
    case GeotagSchemaField.Northing:
      return GeotagSchemaField.Latitude;
    case GeotagSchemaField.Easting:
      return GeotagSchemaField.Longitude;
    case GeotagSchemaField.NorthingAccuracy:
      return GeotagSchemaField.LongitudeAccuracy;
    case GeotagSchemaField.EastingAccuracy:
      return GeotagSchemaField.LongitudeAccuracy;

    default:
      return columnValue;
  }
};

export const swapFieldsToProjectedCrs = (columnValue) => {
  switch (columnValue) {
    case GeotagSchemaField.Latitude:
      return GeotagSchemaField.Northing;
    case GeotagSchemaField.Longitude:
      return GeotagSchemaField.Easting;
    case GeotagSchemaField.LatitudeAccuracy:
      return GeotagSchemaField.NorthingAccuracy;
    case GeotagSchemaField.LongitudeAccuracy:
      return GeotagSchemaField.EastingAccuracy;

    default:
      return columnValue;
  }
};

export const swapFieldsToOPK = (columnValue) => {
  switch (columnValue) {
    case GeotagSchemaField.Omega:
      return GeotagSchemaField.Yaw;
    case GeotagSchemaField.Phi:
      return GeotagSchemaField.Pitch;
    case GeotagSchemaField.Kappa:
      return GeotagSchemaField.Roll;

    default:
      return columnValue;
  }
};

export const swapFieldsToYPR = (columnValue) => {
  switch (columnValue) {
    case GeotagSchemaField.Yaw:
      return GeotagSchemaField.Omega;
    case GeotagSchemaField.Pitch:
      return GeotagSchemaField.Phi;
    case GeotagSchemaField.Roll:
      return GeotagSchemaField.Kappa;

    default:
      return columnValue;
  }
};
