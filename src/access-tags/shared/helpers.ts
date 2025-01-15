export const handleAccessTagErrorMessage = (
  details: Record<string, string>,
) => {
  // TODO: Error matching with slug not string.
  if (
    details['non_field_errors'] &&
    details['non_field_errors'][0] ===
      'The fields name, org must make a unique set.'
  ) {
    return 'Access Tag Name should be unique';
  } else {
    return 'Please ensure fields are filled with valid entries';
  }
};
