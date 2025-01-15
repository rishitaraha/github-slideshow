import validator from 'validator';
import { validate } from '../shared/helpers';

export const siteInputValidator = (
  name: string,
  values: Record<string, any>,
): string => {
  switch (name) {
    case 'baseDSM': {
      break;
    }

    case 'legendImage': {
      break;
    }

    case 'siteBoundary': {
      break;
    }

    case 'longitude':
    case 'latitude': {
      if (!values[name]) {
        return 'This field is required.';
      } else if (!validator.isNumeric(String(values[name]))) {
        return 'Enter a valid number.';
      }
      break;
    }

    default: {
      return validate(name, values);
    }
  }
  return '';
};
