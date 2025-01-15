import { validate } from '../../../../../../../shared/helpers';

export const volumeCalculationValidator = (
  name: string,
  values: Record<string, any>,
): string => {
  switch (name) {
    case 'heapDescription': {
      break;
    }
    case 'bulkDensity': {
      if (isNaN(values.bulkDensity)) {
        return 'Please enter a valid number here';
      }
      break;
    }
    case 'otherIteration': {
      return '';
    }
    default: {
      return validate(name, values);
    }
  }
  return '';
};
