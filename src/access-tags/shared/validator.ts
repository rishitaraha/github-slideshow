import { validate } from '../../shared/helpers';

export const accessTagInputValidator = (
  name: string,
  values: Record<string, any>,
): string => {
  switch (name) {
    case 'tagName': {
      if (!values['tagName']) {
        return 'This field is required';
      } else if (values['tagName'].includes(' ')) {
        return 'No spaces are allowed';
      } else if (values['tagName'].length >= 33) {
        return 'Access Tag Name cannot exceed 32 characters';
      }
      break;
    }

    default: {
      return validate(name, values);
    }
  }
  return '';
};
