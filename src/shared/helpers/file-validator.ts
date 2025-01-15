import { FileExtension } from '../enums';

export const fileValidate = {
  extension: (file: File, extension: FileExtension) => {
    if (file?.name?.includes(extension)) {
      return true;
    }
    return false;
  },
};
