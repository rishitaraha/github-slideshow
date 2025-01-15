import { Formatter } from '../helpers';
import { DynamicFields } from './types';

/**
 * Converts snake_case json response to camelCase response
 */
export const apiDataResponseMapper = <T extends object, P extends object>(
  response: T,
): P => {
  return Formatter.convertKeysSnakeToCamelCase<P>(response);
};

/**
 * Converts camelCase request payload to snake_case response
 */
export const apiPayloadMapper = <T extends object, P extends object>(
  response: T,
): P => {
  return Formatter.convertKeysCamelCaseToSnakeCase<P>(response);
};

/**
 * Maps includeFields or excludeFields from camel case to
 * snake case and returns the request payload with the mapped fields.
 */
export const dynamicFieldsPayloadMapper = <T extends object>(
  payload: DynamicFields<T>,
) => {
  if (payload.includeFields) {
    const mappedFields: string[] = payload.includeFields.map((field) =>
      Formatter.camelCaseToSnakeCase(field.toString()),
    );

    return {
      include_fields: mappedFields.join(','),
    };
  } else if (payload.excludeFields) {
    const mappedFields: string[] = payload.excludeFields.map((field) =>
      Formatter.camelCaseToSnakeCase(field.toString()),
    );

    return {
      exclude_fields: mappedFields.join(','),
    };
  }
};
