import { isEmpty, isNil } from 'lodash';
import { isMultiple, validate } from '../../../../../../../shared/helpers';

export const contourValidator = (
  name: string,
  values: Record<string, any>,
  optional?,
  validatorParams?: Record<string, any>,
): string => {
  switch (name) {
    case 'accessTags':
      if (!validatorParams?.[name].isUserOrgAdmin && isEmpty(values[name])) {
        return 'Access tags are required.';
      }
      break;
    case 'majorInterval':
      if (!isMultiple(values[name], values['minorInterval'])) {
        return 'Major interval should be a multiple of minor interval.';
      }
      break;

    case 'lowestAltitude':
      const lowestAltitude = Number(values[name]);
      if (isNil(values[name])) {
        return 'This field is required.';
      } else if (lowestAltitude > Number(values['highestAltitude'])) {
        return 'Lowest altitude should be lesser than the highest altitude.';
      } else if (lowestAltitude < validatorParams?.[name].lowerBound) {
        return `Lowest altitude should be greater than or equal to ${validatorParams?.[name].lowerBound} m`;
      } else if (lowestAltitude > validatorParams?.[name].upperBound) {
        return `Lowest altitude should be lesser than or equal to ${validatorParams?.[name].upperBound} m`;
      }
      break;

    case 'highestAltitude':
      const highestAltitude = Number(values[name]);
      if (isNil(values[name])) {
        return 'This field is required.';
      } else if (highestAltitude < Number(values['lowestAltitude'])) {
        return 'Highest altitude should be greater than the lowest altitude.';
      } else if (highestAltitude < validatorParams?.[name].lowerBound) {
        return `Highest altitude should be greater than ${validatorParams?.[name].lowerBound} m`;
      } else if (highestAltitude > validatorParams?.[name].upperBound) {
        return `Highest altitude should be lesser than ${validatorParams?.[name].upperBound} m`;
      }
      break;

    default: {
      return validate(name, values);
    }
  }

  return '';
};
