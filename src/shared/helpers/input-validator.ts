import { isArray, isEmpty, isNil, isString, isUndefined, trim } from 'lodash';
import validator from 'validator';

// Common validate function for generally used input names.
export const validate = (
  name: string,
  values: Record<string, any>,
  optional?: Record<string, boolean>,
): string => {
  switch (name) {
    /*
        TODO: Please remove this case below for empty name.
              This case is a fix for a bug where the name get's empty.
              Without this case, The validator will throw "required field" error.
              Please resolve this bug, since this case is an hacky solution.
    */
    case '': {
      break;
    }

    case 'email': {
      if (!values[name]) {
        return 'Email is required';
      } else if (!validator.isEmail(trim(values[name]))) {
        return 'Please enter a valid email';
      }
      break;
    }

    case 'confirmPassword': {
      if (!values[name]) {
        return 'Please confirm the password';
      } else if (values[name] !== values['password']) {
        return 'Passwords do not match';
      }
      break;
    }

    case 'confirmNewPassword': {
      if (!values[name]) {
        return 'Please confirm the new password';
      } else if (values[name] !== values['newPassword']) {
        return 'Passwords do not match';
      }
      break;
    }

    default: {
      const isNameNotOptional = isUndefined(optional) ? true : !optional[name];

      const isValueInvalid =
        isArray(values[name]) || isString(values[name])
          ? isEmpty(values[name])
          : isNil(values[name]);

      if (isNameNotOptional && isValueInvalid) {
        return 'This field is required.';
      }
      break;
    }
  }
  return '';
};
