export enum SearchBarValidationMessages {
  InvalidInputFormat = 'Invalid coordinate format. Enter both latitude and longitude values to initiate the search (e.g., 13.0722, 77.6046)',
  MissingOrIncorrectLatitudeOrLongitude = 'Invalid coordinate format. Search requires latitude and longitude coordinates (e.g., 13.0722, 77.6046)',
  InvalidRangeOfLatitudeOrLongitude = 'Invalid coordinate format. Enter latitude between -90° and +90°, and longitude between -180° and +180° (e.g., 13.0722, 77.6046)',
}
