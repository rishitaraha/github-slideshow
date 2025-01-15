import { isNil } from 'lodash';
import { validate } from 'src/shared/helpers';

export const hraValidator = (
  name: string,
  values: Record<string, any>,
): string => {
  switch (name) {
    case 'vehicleWidth': {
      const vehicleWidth = values.vehicleWidth;
      if (isNil(vehicleWidth)) {
        return 'This field is required.';
      } else if (Number(vehicleWidth) > 100 || Number(vehicleWidth) < 1) {
        return 'The Value exceeds the limit of 100 meters. Please enter a value between 1 and 100 meters.';
      }
      break;
    }
    case 'chainageInterval': {
      const chainageInterval = values.chainageInterval;
      if (isNil(chainageInterval)) {
        return 'This field is required.';
      } else if (
        Number(chainageInterval) > 500 ||
        Number(chainageInterval) < 1
      ) {
        return 'The Value exceeds the limit of 500 meters. Please enter a value between 1 and 500 meters.';
      }
      break;
    }
    default: {
      return validate(name, values);
    }
  }

  return '';
};
