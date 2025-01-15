import { isNil } from 'lodash';
import { FileExtension } from '../../../shared/enums';
import { validate } from '../../../shared/helpers';
import { fileValidate } from '../../../shared/helpers/file-validator';

export const uploadKpiInputValidator = (
  name: string,
  values: Record<string, any>,
  optional?: Record<string, boolean>,
): string => {
  switch (name) {
    case 'csvFile': {
      if (
        !isNil(values[name]) &&
        !fileValidate.extension(values[name], FileExtension.CSV)
      ) {
        return 'Please select .csv file only';
      } else if (isNil(values[name])) {
        return 'This field is required';
      }
    }

    default: {
      return validate(name, values, optional);
    }
  }

  return '';
};
