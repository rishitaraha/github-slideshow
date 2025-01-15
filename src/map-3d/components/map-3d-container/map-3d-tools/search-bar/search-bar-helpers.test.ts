import { describe, it, expect } from 'vitest';
import { parseCoordinates, validateCoordinates } from './helpers';
import { SearchBarValidationMessages } from './enums';
import { ValidationError } from 'src/shared/errors';

describe('parseCoordinates', () => {
  it('should return correct latitude and longitude when input is valid', () => {
    const input = '13.0722, 77.6046';
    const result = parseCoordinates(input);
    expect(result).toEqual({ latitude: 13.0722, longitude: 77.6046 });
  });

  it('should handle input with extra spaces and tabs correctly', () => {
    const input = '  13.0722    ,  77.6046  ';
    const result = parseCoordinates(input);
    expect(result).toEqual({ latitude: 13.0722, longitude: 77.6046 });
  });

  it('should handle input with multiple commas and spaces', () => {
    const input = '13.0722,,,  77.6046';
    const result = parseCoordinates(input);
    expect(result).toEqual({ latitude: 13.0722, longitude: 77.6046 });
  });

  it('should throw an error when input has fewer than two values', () => {
    const input = '13.0722';
    expect(() => parseCoordinates(input)).toThrow(ValidationError);
    expect(() => parseCoordinates(input)).toThrowError(
      SearchBarValidationMessages.InvalidInputFormat,
    );
  });

  it('should throw an error when input has alphanumeric values', () => {
    const input = 'abcds,123asdasfsa';
    expect(() => parseCoordinates(input)).toThrow(ValidationError);
    expect(() => parseCoordinates(input)).toThrowError(
      SearchBarValidationMessages.InvalidInputFormat,
    );
  });
});

describe('validateCoordinates', () => {
  it('should validate correct latitude and longitude', () => {
    const coordinates = { latitude: 13.0722, longitude: 77.6046 };
    expect(() => validateCoordinates(coordinates)).not.toThrow();
  });

  it('should throw an error when latitude is out of range', () => {
    const coordinates = { latitude: 100.1234, longitude: 77.6046 };
    expect(() => validateCoordinates(coordinates)).toThrow(ValidationError);
    expect(() => validateCoordinates(coordinates)).toThrowError(
      SearchBarValidationMessages.InvalidRangeOfLatitudeOrLongitude,
    );
  });

  it('should throw an error when longitude is out of range', () => {
    const coordinates = { latitude: 13.0722, longitude: 200.4567 };
    expect(() => validateCoordinates(coordinates)).toThrow(ValidationError);
    expect(() => validateCoordinates(coordinates)).toThrowError(
      SearchBarValidationMessages.InvalidRangeOfLatitudeOrLongitude,
    );
  });

  it('should throw an error when latitude is NaN', () => {
    const coordinates = { latitude: NaN, longitude: 77.6046 };
    expect(() => validateCoordinates(coordinates)).toThrow(ValidationError);
    expect(() => validateCoordinates(coordinates)).toThrowError(
      SearchBarValidationMessages.MissingOrIncorrectLatitudeOrLongitude,
    );
  });

  it('should throw an error when longitude is NaN', () => {
    const coordinates = { latitude: 13.0722, longitude: NaN };
    expect(() => validateCoordinates(coordinates)).toThrow(ValidationError);
    expect(() => validateCoordinates(coordinates)).toThrowError(
      SearchBarValidationMessages.MissingOrIncorrectLatitudeOrLongitude,
    );
  });

  it('should handle valid negative latitude and longitude values', () => {
    const coordinates = { latitude: -13.0722, longitude: -77.6046 };
    expect(() => validateCoordinates(coordinates)).not.toThrow();
  });

  it('should handle valid negative latitude and longitude values', () => {
    const coordinates = { latitude: -13.0722, longitude: -77.6046 };
    expect(() => validateCoordinates(coordinates)).not.toThrow();
  });

  it('should handle latitude and longitude at min bounds', () => {
    const coordinates = { latitude: -90, longitude: -180 };
    expect(() => validateCoordinates(coordinates)).not.toThrow();
  });

  it('should handle latitude and longitude at max bounds', () => {
    const coordinates = { latitude: 90, longitude: 180 };
    expect(() => validateCoordinates(coordinates)).not.toThrow();
  });
});
