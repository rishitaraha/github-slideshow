import { ProgressBarState, toast } from '@aus-platform/design-system';
import axios from 'axios';
import { isNil, sum } from 'lodash';
import { useRef, useState } from 'react';
import {
  ApiResponse,
  FileDataType,
  FileInfoResponses,
  PresignedUrlResponse,
  StartMultipartUploadResponse,
  queryClient,
  fileInfoMapper,
} from '../../api';
import api from '../../api/api';
import {
  AbortErrorReason,
  MultipartUploadError,
  Part,
  Parts,
  UseMultipartUploadProps,
  UseMultipartUploadReturn,
} from './types';
import { MultipartErrorMessage, MultipartErrorType } from './enums';

export const useMultipartUpload = ({
  fileType,
  urls: uploadURLs,
  chunkSize = 1 * 1024 * 1024 * 1024, // 1 GB
}: UseMultipartUploadProps): UseMultipartUploadReturn => {
  // States.
  const [progress, setProgress] = useState(ProgressBarState.Initial);

  // TODO: Remove after DSM as layer as there will fixed urls for multipart upload.
  const [urls, setUrls] = useState(uploadURLs);
  const [error, setError] = useState<string>();
  const [controller, setController] = useState<AbortController>(
    new AbortController(),
  );
  const [fileResponse, setFileResponse] = useState<FileDataType>();

  // Constants.
  let progressBarValues: Record<string, number> = {};

  // Refs.
  const uploadId = useRef<string>();

  // Event Listener.
  controller.signal.onabort = () => {
    if (isNil(uploadId.current)) {
      return;
    }

    const rejectedPart = {
      ETag: '',
      PartNumber: 99999,
    };

    completeMultipartUpload(uploadId.current, [rejectedPart]);
    handleAbortError();

    /**
     * Not resetting the URL because we want the user to be able to
     * reupload the file when the file upload fails or is cancelled.
     *
     * Uncomment this part when multipart upload flow is fixed.
     */
    // reset(false);
  };

  // Helpers.
  const handleAbortError = () => {
    const signal = controller.signal;
    const reason: AbortErrorReason = signal.reason;

    if (signal.aborted) {
      setError(reason.message);
      toast.error(reason.message);
    }

    if (reason.type === MultipartErrorType.CancelledByUser) {
      setProgress(ProgressBarState.Cancelled);
    } else {
      setProgress(ProgressBarState.Error);
    }
  };

  const handleError = (error?: MultipartUploadError) => {
    const message = !axios.isAxiosError(error)
      ? error?.meta?.message
      : error?.message;

    console.error('API error:', message);
    toast.error('File upload failed. Try again');
    setError(message);
    setProgress(ProgressBarState.Error);
  };

  const initiateMultipartUpload = async (
    filename: string,
  ): Promise<string | undefined> => {
    if (!urls) {
      return;
    }

    try {
      const response = await queryClient.fetchQuery({
        queryKey: [
          'multipart-upload/start-upload',
          filename,
          fileType,
          urls.startUploadUrl,
          controller.signal,
        ],
        queryFn: () =>
          api.post<any, ApiResponse<StartMultipartUploadResponse>>(
            urls.startUploadUrl,
            {
              filename,
              filetype: fileType,
            },
            { signal: controller.signal },
          ),
      });

      return response.data.upload_id;
    } catch (exception) {
      handleError(exception as MultipartUploadError);
    }
  };

  const getPresignedUrl = async (
    uploadId: string,
    partNumber: number,
  ): Promise<string | undefined> => {
    if (!urls) {
      return;
    }

    try {
      const response = await queryClient.fetchQuery({
        queryKey: [
          'multipart-upload/presigned-url',
          partNumber,
          uploadId,
          fileType,
          urls.presignedUrl,
          controller.signal,
        ],
        queryFn: () =>
          api.post<any, ApiResponse<PresignedUrlResponse>>(
            urls.presignedUrl,
            {
              part_number: partNumber,
              upload_id: uploadId,
              filetype: fileType,
            },
            { signal: controller.signal },
          ),
      });
      return response.data.url;
    } catch (exception) {
      if (!controller.signal.aborted) {
        const abortReason: AbortErrorReason = {
          message: MultipartErrorMessage.FileUploadError,
          type: MultipartErrorType.FileUploadError,
        };

        controller.abort(abortReason);
      }
    }
  };

  const uploadChunk = async (
    preSignedUrl: string,
    fileBlob: Blob,
    partNumber: number,
    chunkCount: number,
  ): Promise<Part> => {
    try {
      const response = await axios.put(preSignedUrl, fileBlob, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
        onUploadProgress: (event) => {
          if (event.total && !controller.signal.aborted) {
            progressBarValues[preSignedUrl] =
              (event.loaded * 100) / event.total;

            setProgress(
              Math.round(sum(Object.values(progressBarValues)) / chunkCount),
            );
          }
        },
      });

      return {
        ETag: response.headers['etag'],
        PartNumber: partNumber,
      };
    } catch {
      // TODO: try re-uploading the chunk if it failed due to network error.
      return Promise.reject('File upload failed.');
    }
  };

  const completeMultipartUpload = async (
    uploadId: string,
    multiPartsArray: Parts,
  ) => {
    if (!urls) {
      return;
    }

    try {
      const response = await queryClient.fetchQuery({
        queryKey: [
          'multipart-upload/complete-upload',
          uploadId,
          fileType,
          multiPartsArray,
          urls.completeUploadUrl,
        ],
        queryFn: () =>
          api.post<any, ApiResponse<FileInfoResponses>>(
            urls.completeUploadUrl,
            {
              parts: multiPartsArray,
              upload_id: uploadId,
              filetype: fileType,
            },
          ),
        retry: false,
      });

      // @FIXME: Not receiving file_info in site or iteration
      if (response.data.file_info) {
        setFileResponse(fileInfoMapper(response));
      }

      if (!controller.signal.aborted) {
        setProgress(ProgressBarState.Completed);
      }
    } catch (exception) {
      if (!controller.signal.aborted) {
        handleError(exception as MultipartUploadError);
      }
    }
  };

  // Managers.
  const startUploading = async (file: File) => {
    const chunkCount = Math.ceil(file.size / chunkSize);

    if (!urls) {
      throw new Error('URLs must be set before calling startUploading');
    }

    setProgress(ProgressBarState.Started);

    uploadId.current = await initiateMultipartUpload(file.name);

    if (isNil(uploadId.current)) {
      return;
    }

    const multiPartsUploadPromises: Promise<Part>[] = [];

    for (let partNumber = 1; partNumber <= chunkCount; partNumber++) {
      // File chunk creation.
      const start = (partNumber - 1) * chunkSize;
      const end = partNumber * chunkSize;
      const fileBlob =
        partNumber < chunkCount ? file.slice(start, end) : file.slice(start);

      const preSignedUrl = await getPresignedUrl(uploadId.current, partNumber);
      if (!preSignedUrl || controller.signal.aborted) {
        return;
      }

      const chunkPromise = uploadChunk(
        preSignedUrl,
        fileBlob,
        partNumber,
        chunkCount,
      );

      chunkPromise.catch(() => {
        const abortReason: AbortErrorReason = {
          message: MultipartErrorMessage.FileUploadError,
          type: MultipartErrorType.FileUploadError,
        };

        controller.abort(abortReason);
      });

      multiPartsUploadPromises.push(chunkPromise);
    }

    // Call upload complete api with parts if all parts are uploaded successfully.
    Promise.all(multiPartsUploadPromises)
      .then((multiPartsArray) => {
        setProgress(ProgressBarState.Processing);
        multiPartsArray.sort((a, b) => a.PartNumber - b.PartNumber);

        if (uploadId.current) {
          completeMultipartUpload(uploadId.current, multiPartsArray);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          handleError();
        }
      });
  };

  const cancelUpload = () => {
    const abortReason: AbortErrorReason = {
      message: MultipartErrorMessage.CancelledByUser,
      type: MultipartErrorType.CancelledByUser,
    };

    controller.abort(abortReason);
  };

  const reset = (resetUrls: boolean = true) => {
    resetUrls && setUrls(undefined);
    setError(undefined);
    setProgress(ProgressBarState.Initial);
    progressBarValues = {};

    // Resetting controller so that after aborting one file upload another can be started.
    setController(new AbortController());
  };

  return {
    progress,
    error,
    reset,
    setUrls,
    startUploading,
    cancelUpload,
    fileResponse,
  };
};
