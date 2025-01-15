import { ProgressBarState } from '@aus-platform/design-system';
import { AxiosError } from 'axios';
import { FileType, MultipartErrorMessage, MultipartErrorType } from './enums';
import {
  ApiErrorResponse,
  ApiErrorResponseMessage,
  FileDataType,
} from 'shared/api';

export type MultiPartUploadUrls = {
  startUploadUrl: string;
  presignedUrl: string;
  completeUploadUrl: string;
};

export type UseMultipartUploadProps = {
  fileType: FileType;
  urls?: MultiPartUploadUrls;
  chunkSize?: number;
};

export type UseMultipartUploadReturn = {
  progress: ProgressBarState;
  error?: string;
  reset: (resetUrls?: boolean) => void;
  setUrls: (urls: MultiPartUploadUrls) => void;
  startUploading: (file: File) => void;
  cancelUpload: VoidFunction;
  fileResponse?: FileDataType;
};

export type MultipartUploadError =
  | ApiErrorResponse<ApiErrorResponseMessage>
  | AxiosError;

export type Part = { ETag: string; PartNumber: number };
export type Parts = Part[];

export type AbortErrorReason = {
  message: MultipartErrorMessage;
  type: MultipartErrorType;
};
