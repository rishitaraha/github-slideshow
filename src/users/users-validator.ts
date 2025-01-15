import { validate } from '../shared/helpers';

export const userValidator = (
  name: string,
  values: Record<string, any>,
): string => {
  switch (name) {
    case 'isDeactivateUser': {
      break;
    }

    case 'isOrgAdminUser': {
      break;
    }

    default: {
      return validate(name, values);
    }
  }
  return '';
};
