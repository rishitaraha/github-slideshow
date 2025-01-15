import { FileType } from '../../hooks';

export type Part = { ETag: any; PartNumber: number };
export type Parts = Part[];

export type CompleteMultiPartUploadPayload = {
  url: string;
  uploadId: string;
  filetype?: FileType;
  parts?: Parts;
};

export type DownloadFileResponse = {
  downloadUrl: string | null;
};
