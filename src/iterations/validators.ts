import { validate } from '../shared/helpers';

export const iterationInputValidator = (
  name: string,
  values: Record<string, any>,
): string => {
  switch (name) {
    case 'info':
    case 'orthomosaic':
    case 'capturedDSM': {
      break;
    }

    default: {
      return validate(name, values);
    }
  }
  return '';
};
