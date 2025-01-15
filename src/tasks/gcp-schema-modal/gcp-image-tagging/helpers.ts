import { ExifOrientationNumber } from '../../constants';

export const RotationalTransformValuesFromScreenImageToStorageImage = (
  imageOrientation: ExifOrientationNumber,
  imageWidth: number,
  imageHeight: number,
  xAxisTagCoordinate: number,
  yAxisTagCoordinate: number,
) => {
  let xUpdated = xAxisTagCoordinate;
  let yUpdated = yAxisTagCoordinate;

  switch (imageOrientation) {
    case ExifOrientationNumber.Three:
      xUpdated = (imageWidth ?? 0) - xAxisTagCoordinate;
      yUpdated = (imageHeight ?? 0) - yAxisTagCoordinate;
      break;
    case ExifOrientationNumber.Six:
      xUpdated = yAxisTagCoordinate;
      yUpdated = (imageWidth ?? 0) - xAxisTagCoordinate;
      break;
    case ExifOrientationNumber.Eight:
      xUpdated = (imageHeight ?? 0) - yAxisTagCoordinate;
      yUpdated = xAxisTagCoordinate;
      break;
  }

  return { xUpdated, yUpdated };
};

export const RotationalTransformValuesFromStorageImageToScreenImage = (
  imageOrientation: ExifOrientationNumber,
  imageWidth: number,
  imageHeight: number,
  xAxisTagCoordinate: number,
  yAxisTagCoordinate: number,
) => {
  let xUpdated = xAxisTagCoordinate;
  let yUpdated = yAxisTagCoordinate;

  switch (imageOrientation) {
    case ExifOrientationNumber.Three:
      xUpdated = (imageWidth ?? 0) - xAxisTagCoordinate;
      yUpdated = (imageHeight ?? 0) - yAxisTagCoordinate;
      break;
    case ExifOrientationNumber.Six:
      xUpdated = (imageWidth ?? 0) - yAxisTagCoordinate;
      yUpdated = xAxisTagCoordinate;
      break;
    case ExifOrientationNumber.Eight:
      xUpdated = yAxisTagCoordinate;
      yUpdated = (imageHeight ?? 0) - xAxisTagCoordinate;
      break;
  }
  return { xUpdated, yUpdated };
};
