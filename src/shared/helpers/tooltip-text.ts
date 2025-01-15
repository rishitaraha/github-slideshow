import { StatusIndicatorLevel } from '@aus-platform/design-system';

export const getFileStatusText = (
  fileType: string,
  status: StatusIndicatorLevel,
) => {
  if (
    status == StatusIndicatorLevel.Completed ||
    status == StatusIndicatorLevel.Done
  ) {
    return `${fileType} Generated`;
  } else if (
    status == StatusIndicatorLevel.Started ||
    status == StatusIndicatorLevel.Processing
  ) {
    return `${fileType} is Processing`;
  } else if (status == StatusIndicatorLevel.Failed) {
    return `${fileType} Failed`;
  } else if (status == StatusIndicatorLevel.Importing) {
    return `Importing ${fileType}`;
  } else if (status === StatusIndicatorLevel.Deleted) {
    return `${fileType} Deleted`;
  }
};
