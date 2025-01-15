import { FileExtension, FileUploadStatus } from 'src/tasks/enums';

export const selectedFilesCleanup = (files: FileList) => {
  return Array.from(files).filter(
    (file: File) =>
      !(file.name.startsWith('.') || file.name.startsWith('_')) &&
      file.size > 0,
  );
};

export const createFileStatusObj = (files: File[], fileStatusObjRef) => {
  for (const file of files) {
    if (!(file.name in fileStatusObjRef.current)) {
      fileStatusObjRef.current[file.name] = {
        status: FileUploadStatus.Pending,
        fileObject: file,
      };
    }
  }
};

export const containsImages = (files: File[]) =>
  files.every((file) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    return fileExtension
      ? [
          FileExtension.Jpeg.valueOf(),
          FileExtension.Jpg.valueOf(),
          FileExtension.Png.valueOf(),
        ].includes(fileExtension)
      : false;
  });
