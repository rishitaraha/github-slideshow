import { validate } from 'shared/helpers';
import { CoordinatesRange } from 'src/tasks/gcp-schema-modal/gcp-edit-modal/constants';

export const editCoordinatesValidator = (
  name: string,
  values: Record<string, any>,
): string => {
  const isCRSGeographic = values['isCRSGeographic'];

  switch (name) {
    case 'xCoordinate': {
      const xCoordinate = values[name];
      if (isCRSGeographic) {
        if (
          xCoordinate > CoordinatesRange.LongitudeMaxRange ||
          xCoordinate < CoordinatesRange.LongitudeMinRange
        ) {
          return 'Longitude should lie between 180, -180';
        }
      } else {
        if (
          xCoordinate > CoordinatesRange.EastingMaxRange ||
          xCoordinate < CoordinatesRange.EastingMinRange
        ) {
          return 'Easting should lie between 0 to 1,000,000';
        }
      }
      break;
    }

    case 'yCoordinate': {
      const yCoordinate = values[name];
      if (isCRSGeographic) {
        if (
          yCoordinate > CoordinatesRange.LatitudeMaxRange ||
          yCoordinate < CoordinatesRange.LatitudeMinRange
        ) {
          return 'Latitude should lie between 90, -90';
        }
      } else {
        if (
          yCoordinate > CoordinatesRange.NorthingMaxRange ||
          yCoordinate < CoordinatesRange.NorthingMinRange
        ) {
          return 'Northing should lie between 0 to 10,000,000';
        }
      }
    }

    case 'zCoordinate': {
      const zCoordinate = values[name];
      if (zCoordinate < -100 || zCoordinate > 10000) {
        return 'Altitude should lie between -100, 10000';
      }
    }

    default: {
      return validate(name, values);
    }
  }
  return '';
};
