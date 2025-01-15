import { isEmpty } from 'lodash';
import { validate } from '../../../../../shared/helpers';

export const slopeMapValidator = (
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
    default: {
      return validate(name, values);
    }
  }

  return '';
};
