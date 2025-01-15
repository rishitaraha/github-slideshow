import validator from 'validator';

export const userGroupValidator = (
  name: string,
  values: Record<string, any>,
): string => {
  switch (name) {
    case 'name': {
      if (!validator.isLength(values[name], { min: 1 })) {
        return 'Group name is required';
      }
      if (!validator.isLength(values[name], { max: 256 })) {
        return 'Group name cannot exceed 256 characters';
      }
    }
  }
  return '';
};
