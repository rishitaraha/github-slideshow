import { ErrorSlugs } from 'shared/enums';

export const elevationProfileToastErrors = {
  [ErrorSlugs.LineOutOfBounds]: {
    label: 'Elevation Line out of bounds',
    message:
      'Please make sure the elevation line is drawn within the bounds of uploaded DSM',
  },
};
