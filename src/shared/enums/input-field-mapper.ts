const inputFieldNameMaps = {
  first_name: 'firstName',
  last_name: 'lastName',
  access_tags: 'accessTags',
  old_password: 'currentPassword',
  new_password: 'newPassword',
  confirm_new_password: 'confirmNewPassword',
};

export const inputFieldNameMapper = (fieldName: string): string => {
  if (inputFieldNameMaps.hasOwnProperty(fieldName)) {
    return inputFieldNameMaps[fieldName];
  }
  return fieldName;
};
