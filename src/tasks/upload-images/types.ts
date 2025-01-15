import { FileUploadStatus } from 'src/tasks/enums';

export type FileStatusObject = {
  [fileName: string]: {
    status: FileUploadStatus;
    fileObject?: File;
  };
};

export type ImageUploadHandlerCallbacks = {
  onNetworkErrorOccurred: () => void;
  updateFileUploadStatus: (fileName: string, status: FileUploadStatus) => void;
};

export type ProcessIdWithTimestamp = {
  processId: string;
  lastUpdated: number;
};
