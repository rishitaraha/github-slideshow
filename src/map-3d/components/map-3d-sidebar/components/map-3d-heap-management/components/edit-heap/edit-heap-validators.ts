import { validate } from '../../../../../../../shared/helpers';

export const editHeapValidator = (
  name: string,
  values: Record<string, any>,
): string => {
  switch (name) {
    case 'description': {
      break;
    }
    case 'bulkDensity': {
      break;
    }

    default: {
      return validate(name, values);
    }
  }
  return '';
};
