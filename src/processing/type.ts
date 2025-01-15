import { ProcessingConnectionStatus, ProcessingMessageType } from './enums';

export type MessageFromProcessing<T = any> = {
  messageType: ProcessingMessageType;
  data: T;
};

export type ExportFileType = {
  bucket: string;
  key: string;
};

export type ExportFilesDataType = {
  orthophoto?: ExportFileType;
  orthophoto_cog?: ExportFileType;
  dsm?: ExportFileType;
  dsm_cog?: ExportFileType;
};

export type ConnectionStatusDataType = {
  connectionStatus: ProcessingConnectionStatus;
};

export type ProcessingPathChangeDataType = {
  path: string;
  search: string;
};
