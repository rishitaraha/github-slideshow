import axios, { CancelTokenSource } from 'axios';

import { ProcessIdWithTimestamp, ImageUploadHandlerCallbacks } from './types';
import { RejectablePromise } from 'src/shared/helpers/rejectablePromise';
import { FileUploadStatus, ProcessIdKeysInLocalStorage } from 'src/tasks/enums';
import { UnhandledApiErrorMessage } from 'src/shared/api';
import autoRefreshApi from 'src/shared/api/auto-refresh-api';

type ImageUploadDetails = {
  imageName: string;
  imageBlob: Blob;
  signedUrl: string;
};

// Pinging the backend after successful upload of image to s3.
const imageUploadedSuccessfully = async (
  iterationId: string,
  imageName: string,
  cancelToken: CancelTokenSource,
) => {
  const imageUploadSuccess = autoRefreshApi.post(
    `processing/iteration-dataset/${iterationId}/image-upload-success/`,
    {
      image_filename: imageName,
    },
    {
      cancelToken: cancelToken.token,
    },
  );
  return imageUploadSuccess;
};

// Uploading images over signed url.
const imageUploadOverSignedUrl = async (
  signedUrl: string,
  imageBlob: Blob,
  cancelToken: CancelTokenSource,
  regenerateConnectionTimeout: (duration: number) => NodeJS.Timeout,
) => {
  await axios.put(signedUrl, imageBlob, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'x-amz-storage-class': 'STANDARD_IA', // Ref: https://github.com/boto/boto3/issues/1824.
    },
    cancelToken: cancelToken?.token,
    onUploadProgress: () => {
      // This event gets fired every half second in case there is a network connection,
      // if there is no network connection for >5 seconds, network error will be shown.
      regenerateConnectionTimeout(5000);
    },
  });
};

/* Wrapper function -> Image Upload over signed url,
 Single Image upload complete, Update progress callback. */
const singleImageUploadHandler = async (
  imageDetailsObj: ImageUploadDetails,
  iterationDatasetId: string,
  cancelToken: CancelTokenSource,
  regenerateConnectionTimeout: (duration: number) => NodeJS.Timeout,
  updateFileUploadStatus: (fileName: string, status: FileUploadStatus) => void,
) => {
  await imageUploadOverSignedUrl(
    imageDetailsObj.signedUrl,
    imageDetailsObj.imageBlob,
    cancelToken,
    regenerateConnectionTimeout,
  );

  await imageUploadedSuccessfully(
    iterationDatasetId,
    imageDetailsObj.imageName,
    cancelToken,
  );

  updateFileUploadStatus(imageDetailsObj.imageName, FileUploadStatus.Completed);
};

const batchImageUploadOverSignedUrlPromiseList = async (
  signedUrls: string[],
  batchImageList: File[],
  iterationDatasetId: string,
  cancelToken: CancelTokenSource,
  networkTimeout: {
    closeConnectionTimeout(): void;
    regenerateConnectionTimeout(duration: number): NodeJS.Timeout;
    generateConnectionTimeout(duration: number): NodeJS.Timeout;
  },
  updateFileUploadStatus: (fileName: string, status: FileUploadStatus) => void,
): Promise<any> => {
  // Creating a cancellation timeout.
  networkTimeout.generateConnectionTimeout(10000);

  const batchImageUploadPromise = signedUrls.map(
    async (signedUrl: string, index: number) => {
      const imageBlob = new Blob([batchImageList[index]], {
        type: batchImageList[index].type,
      });

      // Creating an image obj.
      const imageDetailsObj: ImageUploadDetails = {
        imageName: batchImageList[index].name,
        imageBlob,
        signedUrl,
      };

      await singleImageUploadHandler(
        imageDetailsObj,
        iterationDatasetId,
        cancelToken,
        networkTimeout.regenerateConnectionTimeout,
        updateFileUploadStatus,
      );

      networkTimeout.closeConnectionTimeout();
    },
  );

  return Promise.all(batchImageUploadPromise);
};

// Fetching presigned url for batch of images.
const presignedUrlListGenerator = async (
  imageFilenameList: string[],
  iterationDatasetId: string,
  cancelToken: CancelTokenSource,
): Promise<string[]> => {
  const generatedPresignedUrl = await autoRefreshApi.post(
    `processing/iteration-dataset/${iterationDatasetId}/images-presigned-url/`,
    {
      filenames: imageFilenameList,
    },
    {
      cancelToken: cancelToken?.token,
    },
  );
  return generatedPresignedUrl.data.presigned_urls;
};

// Wrapper function -> Presigned URL generation, Image Uploading.
const batchUploadHandler = async (
  batchImageList: File[],
  iterationDatasetId: string,
  cancelToken: CancelTokenSource,
  networkTimeout: {
    closeConnectionTimeout(): void;
    regenerateConnectionTimeout(duration: number): NodeJS.Timeout;
    generateConnectionTimeout(duration: number): NodeJS.Timeout;
  },
  updateFileUploadStatus: (fileName: string, status: FileUploadStatus) => void,
) => {
  // Getting name of each image in the batch.
  const imageFilenameList = batchImageList.map((image) => {
    return image.name;
  });

  // Fetching presigned url list for the batch.
  const batchImagesSignedUrls = await presignedUrlListGenerator(
    imageFilenameList,
    iterationDatasetId,
    cancelToken,
  );

  return batchImageUploadOverSignedUrlPromiseList(
    batchImagesSignedUrls,
    batchImageList,
    iterationDatasetId,
    cancelToken,
    networkTimeout,
    updateFileUploadStatus,
  );
};

const errorHandler = (
  cancelToken: CancelTokenSource,
  onNetworkErrorOccured: () => void,
  cancellationTimeout: {
    closeConnectionTimeout(): void;
    regenerateConnectionTimeout(duration: number): NodeJS.Timeout;
    generateConnectionTimeout(duration: number): NodeJS.Timeout;
  },
  errorType?: any,
) => {
  if (cancellationTimeout) {
    cancellationTimeout.closeConnectionTimeout();
  }

  if (cancelToken) {
    cancelToken.cancel();
  }

  if (
    errorType?.message === UnhandledApiErrorMessage.NetworkError ||
    errorType === UnhandledApiErrorMessage.NetworkError
  ) {
    onNetworkErrorOccured();
  }
};

// Converts a list into 2d array.
const batchedImageListGenerator = (
  filesToUpload: File[],
  batchSize: number,
): File[][] => {
  const batchedFiles = filesToUpload.reduce(
    (batchedImages: File[][], image, index) => {
      const batchIndex = Math.floor(index / batchSize);
      if (!batchedImages[batchIndex]) {
        batchedImages[batchIndex] = []; // start a new chunk
      }
      batchedImages[batchIndex].push(image);
      return batchedImages;
    },
    [],
  );
  return batchedFiles;
};

// Ref: https://stackoverflow.com/a/43082995
// Sequential execution of promises.
const sequentialPromiseMap = async (
  batchImageList: File[][],
  iterationDatasetId: string,
  cancelToken: CancelTokenSource,
  networkTimeout: {
    closeConnectionTimeout(): void;
    regenerateConnectionTimeout(duration: number): NodeJS.Timeout;
    generateConnectionTimeout(duration: number): NodeJS.Timeout;
  },
  updateFileUploadStatus: (fileName: string, status: FileUploadStatus) => void,
  action: (
    imageList: File[],
    iterationDatasetId: string,
    cancelToken: CancelTokenSource,
    networkTimeout: {
      closeConnectionTimeout(): void;
      regenerateConnectionTimeout(duration: number): NodeJS.Timeout;
      generateConnectionTimeout(duration: number): NodeJS.Timeout;
    },
    updateFileUploadStatus: (
      fileName: string,
      status: FileUploadStatus,
    ) => void,
  ) => Promise<any>,
) => {
  for (const imageList of batchImageList) {
    await action(
      imageList,
      iterationDatasetId,
      cancelToken,
      networkTimeout,
      updateFileUploadStatus,
    );
  }
};

export const uploadProcessIdLocalStorageManager = {
  getProcessObject: () => {
    const localStorageProcessIdsWithTimestamps: ProcessIdWithTimestamp[] =
      JSON.parse(
        localStorage.getItem(
          ProcessIdKeysInLocalStorage.UploadProcessesQueue,
        ) || '[]',
      );

    return localStorageProcessIdsWithTimestamps;
  },

  setProcessObject: (
    localStorageProcessIdsWithTimestamps: ProcessIdWithTimestamp[],
  ) => {
    localStorage.setItem(
      ProcessIdKeysInLocalStorage.UploadProcessesQueue,
      JSON.stringify(localStorageProcessIdsWithTimestamps),
    );
  },

  removeProcessObject: (
    localStorageProcessIdsWithTimestamps: ProcessIdWithTimestamp[],
    processId: string,
  ) => {
    if (localStorageProcessIdsWithTimestamps.length > 0) {
      localStorageProcessIdsWithTimestamps =
        localStorageProcessIdsWithTimestamps.filter(
          (item) => item.processId !== processId,
        );
    }
    return localStorageProcessIdsWithTimestamps;
  },
};

const networkConnectionTimeout = (
  imageListUploadPromise: RejectablePromise,
) => {
  let generatedTimeout: NodeJS.Timeout;

  const connectionTimeout = (duration: number) => {
    generatedTimeout = setTimeout(() => {
      imageListUploadPromise.reject(UnhandledApiErrorMessage.NetworkError);
    }, duration);
  };

  return {
    // Remove the connection timeout.
    closeConnectionTimeout() {
      clearTimeout(generatedTimeout);
    },

    // Resetting timeout with required duration.
    regenerateConnectionTimeout(duration: number) {
      clearTimeout(generatedTimeout);
      connectionTimeout(duration);
      return generatedTimeout;
    },

    // Generation a timeout which throws network error if not cleared.
    generateConnectionTimeout(duration: number) {
      connectionTimeout(duration);
      return generatedTimeout;
    },
  };
};

export const imageListUploadHandler = async ({
  imageList,
  iterationDatasetId,
  imageUploadHandlerCallbacks,
}: {
  imageList: File[];
  iterationDatasetId: string;
  imageUploadHandlerCallbacks: ImageUploadHandlerCallbacks;
}): Promise<any> => {
  const imageListUploadPromise = new RejectablePromise();

  // Getting callbacks.
  const { onNetworkErrorOccurred, updateFileUploadStatus } =
    imageUploadHandlerCallbacks;

  // Generating 2d list.
  const batchedImageList = batchedImageListGenerator(imageList, 5);

  // Generating cancel token for api requests.
  const cancelToken = axios.CancelToken.source();

  // Creating connection timeout closure.
  const networkTimeout = networkConnectionTimeout(imageListUploadPromise);

  // Catching promise rejection/errors.
  imageListUploadPromise.promise.catch((error) => {
    errorHandler(cancelToken, onNetworkErrorOccurred, networkTimeout, error);
  });

  // Sequential execution of promises.
  sequentialPromiseMap(
    batchedImageList,
    iterationDatasetId,
    cancelToken,
    networkTimeout,
    updateFileUploadStatus,
    batchUploadHandler,
  ).catch((error) => {
    imageListUploadPromise.reject(error);
  });

  return imageListUploadPromise;
};
