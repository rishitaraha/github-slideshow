import { SearchBarValidationMessages } from './enums';
import { GeographicCoordinates2D } from './types';
import { ValidationError } from 'shared/errors';

/**
 * Parses a string input of latitude and longitude coordinates.
 *
 * The input can have latitude and longitude separated by spaces, tabs, or commas,
 * and the function normalizes the input into a comma-separated format.
 *
 * @param {string} coordinatesInputString - The string input containing latitude and longitude coordinates.
 * @returns {GeographicCoordinates2D} An object containing the parsed latitude and longitude values.
 * @throws {ValidationError} If the input format is invalid or if parsing fails.
 */
export const parseCoordinates = (
  coordinatesInputString: string,
): GeographicCoordinates2D => {
  // Normalize the input by replacing multiple spaces, tabs, or commas with a single comma.
  const normalizedInput = coordinatesInputString
    .trim()
    .replace(/\s+/g, ',')
    .replace(/,+/g, ',')
    .trim();

  const parts = normalizedInput.split(',');

  if (parts.length !== 2) {
    throw new ValidationError(SearchBarValidationMessages.InvalidInputFormat);
  }
  const latitude = Number(parts[0].trim());
  const longitude = Number(parts[1].trim());

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new ValidationError(SearchBarValidationMessages.InvalidInputFormat);
  }

  return { latitude, longitude };
};

/**
 * Validates the latitude and longitude values, ensuring latitude is between -90° and +90°
 * and longitude is between -180° and +180°.
 *
 * @param {GeographicCoordinates2D} coordinates - The object containing latitude and longitude values.
 * @throws {ValidationError} If latitude or longitude is out of range or not a valid number.
 */
export const validateCoordinates = (
  coordinates: GeographicCoordinates2D,
): void => {
  const { latitude, longitude } = coordinates;

  // Check if latitude and longitude are valid decimal numbers.
  if (isNaN(latitude) || isNaN(longitude)) {
    throw new ValidationError(
      SearchBarValidationMessages.MissingOrIncorrectLatitudeOrLongitude,
    );
  }

  // Validate latitude and longitude ranges.
  if (latitude < -90 || latitude > 90) {
    throw new ValidationError(
      SearchBarValidationMessages.InvalidRangeOfLatitudeOrLongitude,
    );
  }

  if (longitude < -180 || longitude > 180) {
    throw new ValidationError(
      SearchBarValidationMessages.InvalidRangeOfLatitudeOrLongitude,
    );
  }
};

/**
 * Main function that combines parsing and validation.
 *
 * @param {string} coordinatesInputString - The string input containing latitude and longitude coordinates.
 * @returns {GeographicCoordinates2D} The validated latitude and longitude.
 * @throws {ValidationError} If latitude or longitude is out of range ,not a valid number,input format is invalid or if parsing fails.
 */
export const parseAndValidateCoordinates = (
  coordinatesInputString: string,
): GeographicCoordinates2D => {
  const coordinates = parseCoordinates(coordinatesInputString);
  validateCoordinates(coordinates);
  return coordinates;
};
