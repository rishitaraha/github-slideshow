import { v4 as uuidv4 } from 'uuid';

import { isEmpty, isNil, isNull, isUndefined, remove } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { AxiosResponse } from 'axios';
import { FileUploadStage, FileUploadStatus } from '../../enums';

import {
  imageListUploadHandler,
  uploadProcessIdLocalStorageManager,
} from '../image-upload-handler';
import {
  FileStatusObject,
  ImageUploadHandlerCallbacks,
  ProcessIdWithTimestamp,
} from '../types';
import {
  containsImages,
  createFileStatusObj,
  removeOrphanIds,
  removeProcessId,
  selectedFilesCleanup,
  updateProcessId,
} from '../utils';

import { ApiResponse, useCompleteImageUploadRequest } from 'src/shared/api';
import { EnvVariables } from 'src/shared/env-variables';
import { RejectablePromise } from 'src/shared/helpers/rejectablePromise';
import autoRefreshApi from 'src/shared/api/auto-refresh-api';

export const useUploadImages = (
  iterationDatasetId: string,
  isReupload: boolean,
) => {
  // Refs.
  const processIdRef = useRef('');
  const fileStatusObj = useRef<FileStatusObject>({});
  const localStorageTimestampIntervalId = useRef<NodeJS.Timeout | null>(null);

  // States.
  const [uploadStage, setUploadStage] = useState(
    FileUploadStage.SelectImagesToUpload,
  );
  const [uploadImagePromise, setUploadImagePromise] =
    useState<RejectablePromise>();
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const [uploadImagesProgressDetails, setUploadImagesProgressDetails] =
    useState({
      numberOfFilesUploaded: 0,
      progressPercentage: 0,
      totalNumberOfFiles: 0,
    });

  // APIs.
  const {
    mutate: sendCompleteImageUploadRequest,
    isSuccess: isCompleteImageUploadSuccess,
    isError: isCompleteImageUploadError,
    data: completeImageUploadResponse,
    error: completeImageUploadRequestError,
  } = useCompleteImageUploadRequest();

  useEffect(() => {
    if (completeImageUploadResponse && isCompleteImageUploadSuccess) {
      updateFileUploadStage(FileUploadStage.Uploaded);
    }
    if (completeImageUploadResponse && isCompleteImageUploadError) {
      updateFileUploadStage(FileUploadStage.Error);
    }
  }, [completeImageUploadResponse]);

  useEffect(() => {
    let elapsedInterval: NodeJS.Timeout;
    const stages = [FileUploadStage.Uploading, FileUploadStage.NetworkError];

    if (stages.includes(uploadStage)) {
      elapsedInterval = setInterval(() => {
        setElapsedTime((prevState) => prevState + 1000);
      }, 1000);
    }

    return () => {
      if (!isUndefined(elapsedInterval)) {
        clearInterval(elapsedInterval);
      }
    };
  }, [uploadStage]);

  useEffect(() => {
    window.onbeforeunload = () =>
      removeProcessId(
        true,
        processIdRef.current,
        localStorageTimestampIntervalId,
        processIdRef,
      );
  }, []);

  const createPreviouslyUploadedFileStatusObj = (
    filenames: string[],
  ): FileStatusObject => {
    const previouslyUploadedFileStatusObj = {};
    for (const filename of filenames) {
      previouslyUploadedFileStatusObj[filename] = {
        status: FileUploadStatus.Completed,
      };
    }
    return previouslyUploadedFileStatusObj;
  };

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isNull(e.target.files)) {
      const files = selectedFilesCleanup(e.target.files);
      createFileStatusObj(files, fileStatusObj);
      uploadFiles(iterationDatasetId, files);
    }
  };

  const onImagesUploadComplete = (iterationDatasetId, uploadStatus) => {
    if (iterationDatasetId) {
      sendCompleteImageUploadRequest({
        iterationDatasetId,
        uploadStatus,
      });
    }
    removeProcessId(
      true,
      processIdRef.current,
      localStorageTimestampIntervalId,
      processIdRef,
    );
  };

  const updateProgressDetails = (
    numberOfFilesUploaded?: number,
    progressPercentage?: number,
    totalNumberOfFiles?: number,
  ) => {
    setUploadImagesProgressDetails((prevState) => ({
      numberOfFilesUploaded: numberOfFilesUploaded
        ? numberOfFilesUploaded
        : prevState.numberOfFilesUploaded,
      progressPercentage: progressPercentage
        ? progressPercentage
        : prevState.progressPercentage,
      totalNumberOfFiles: totalNumberOfFiles
        ? totalNumberOfFiles
        : prevState.totalNumberOfFiles,
    }));
  };

  const updateFileUploadStage = (stage, progressPercentage?: number) => {
    setUploadStage(stage);
    if (progressPercentage) {
      updateProgressDetails(undefined, progressPercentage, undefined);
    }
  };

  // Fetching previously uploaded images.
  const getPreviouslyUploadedImageList = async (iterationDatasetId: string) => {
    const previouslyUploadedImageList = await autoRefreshApi.get<
      any,
      ApiResponse<any>
    >(
      `${EnvVariables.backendUrl}/processing/iteration-dataset/${iterationDatasetId}/images-list/`,
    );

    return previouslyUploadedImageList.data;
  };

  const updateNumberOfFilesAndPercentage = () => {
    const numberOfImagesUploaded = Object.values(fileStatusObj.current).filter(
      (file) => file.status === FileUploadStatus.Completed,
    ).length;
    const totalNumberOfImages = Object.keys(fileStatusObj.current).length;
    const progressPercentage = Math.floor(
      (numberOfImagesUploaded * 100) / totalNumberOfImages,
    );
    updateProgressDetails(
      numberOfImagesUploaded,
      progressPercentage,
      totalNumberOfImages,
    );

    if (numberOfImagesUploaded === totalNumberOfImages) {
      updateFileUploadStage(FileUploadStage.Uploaded, progressPercentage);
      onImagesUploadComplete(iterationDatasetId, 'done');
    } else {
      updateFileUploadStage(FileUploadStage.Uploading, progressPercentage);
    }
  };

  const updatePreviouslyUploadedImagesUploadFileStatusObject = (
    previouslyUploadedImagesObject: FileStatusObject,
  ) => {
    fileStatusObj.current = {
      ...fileStatusObj.current,
      ...previouslyUploadedImagesObject,
    };
  };

  const updateUploadFileStatusObject = (
    filename: string,
    status: FileUploadStatus,
    fileObj?: File,
  ) => {
    fileStatusObj.current[filename] = {
      status,
      fileObject: fileObj ?? fileStatusObj.current[filename].fileObject,
    };
    updateNumberOfFilesAndPercentage();
  };

  const retryImageUploadOnErrorOccurred = async () => {
    // Filtering fileObject to create an array of not uploaded files.
    const filesList = Object.entries(fileStatusObj.current)
      .filter(
        (item) =>
          !isNil(item[1].fileObject) &&
          item[1].status != FileUploadStatus.Completed,
      )
      .map((item) => item[1].fileObject);

    if (!isEmpty(filesList)) {
      await imageUploader(iterationDatasetId, filesList);
    }
  };

  const waitForNetworkAndReupload = async (waitTime: number) => {
    // Waiting for waitTime.
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    const url = EnvVariables.backendUrl.toString() + '/ping';

    try {
      const connectionPing = await autoRefreshApi.get<
        AxiosResponse<ApiResponse>,
        ApiResponse<string>
      >(url);
      // If network connection exists, retry image upload.
      if (connectionPing.meta.status_code === 200) {
        await retryImageUploadOnErrorOccurred();
      }
    } catch (error) {
      // Recalling function.
      await waitForNetworkAndReupload(waitTime);
    }
  };

  const onNetworkErrorOccurred = async () => {
    updateFileUploadStage(FileUploadStage.NetworkError);
    await waitForNetworkAndReupload(3000);
  };

  const imageUploaderCallBack: ImageUploadHandlerCallbacks = {
    updateFileUploadStatus: updateUploadFileStatusObject,
    onNetworkErrorOccurred: onNetworkErrorOccurred,
  };

  const getFilesToUpload = async (
    files: FileList,
    iterationDatasetId: string,
  ) => {
    const selectedImageList = [...files];

    const filesToUpload: File[] = [];

    const uploadedImagesList =
      await getPreviouslyUploadedImageList(iterationDatasetId);

    if (uploadedImagesList.filenames) {
      const previouslyUploadedImageObj = createPreviouslyUploadedFileStatusObj(
        uploadedImagesList.filenames,
      );

      updatePreviouslyUploadedImagesUploadFileStatusObject(
        previouslyUploadedImageObj,
      );

      const filesRequiredToUpload = remove(selectedImageList, (file) => {
        return !uploadedImagesList.filenames.includes(file.name);
      });

      if (filesRequiredToUpload.length > 0) {
        updateNumberOfFilesAndPercentage();
      }

      filesToUpload.push(...filesRequiredToUpload);
    }

    return filesToUpload;
  };

  const imageUploader = async (iterationDatasetId: string, files) => {
    const filesToUpload = await getFilesToUpload(files, iterationDatasetId);
    // If all files already exist, throwing an error.
    if (filesToUpload.length === 0) {
      updateFileUploadStage(FileUploadStage.ImagesPreviouslyUploadedError);
      return;
    }
    updateFileUploadStage(FileUploadStage.Uploading);

    const imagePromise: RejectablePromise = await imageListUploadHandler({
      imageList: filesToUpload,
      iterationDatasetId,
      imageUploadHandlerCallbacks: imageUploaderCallBack,
    });

    setUploadImagePromise(imagePromise);
  };

  const initiateFileUpload = async (iterationDatasetId: string, files) => {
    if (!files) {
      setUploadStage(FileUploadStage.Error);
      return;
    }
    // Obtaining file extension from the file name.
    if (containsImages([...files])) {
      if (files.length < 20 && !isReupload) {
        setUploadStage(FileUploadStage.MinimumImagesError);
        return;
      }
      await imageUploader(iterationDatasetId, files);
    } else {
      setUploadStage(FileUploadStage.Error);
    }
  };

  // Uploading handlers.
  const uploadFiles = (iterationDatasetId: string, files) => {
    if (!processIdRef.current) {
      processIdRef.current = uuidv4();
    }

    updateProcessId(processIdRef.current, localStorageTimestampIntervalId);

    setUploadStage(FileUploadStage.QueuedToUpload);
    const uploadIntervalId = setInterval(() => {
      const localStorageProcessIdsWithTimestamps: ProcessIdWithTimestamp[] =
        uploadProcessIdLocalStorageManager.getProcessObject();
      if (localStorageProcessIdsWithTimestamps.length > 0) {
        if (
          localStorageProcessIdsWithTimestamps[0].processId ===
          processIdRef.current
        ) {
          // Start process if current process id is the first in process ids objs list.
          setUploadStage(FileUploadStage.StartingToUpload);
          clearInterval(uploadIntervalId);
          initiateFileUpload(iterationDatasetId, files);
        } else {
          removeOrphanIds(
            localStorageProcessIdsWithTimestamps,
            localStorageTimestampIntervalId,
            processIdRef,
          );
        }
      }
    }, 1000);
  };

  const onCancelUpload = () => {
    uploadImagePromise?.reject();
    onImagesUploadComplete(iterationDatasetId, 'done');
    setUploadStage(FileUploadStage.Cancelled);
  };

  // Progress bar handlers.
  const getImageUploadStatus = () => {
    if (completeImageUploadRequestError?.meta.message) {
      return `Validation Error: ${completeImageUploadRequestError?.meta.message}`;
    } else {
      const uploadStatusMessage = {
        [FileUploadStage.Cancelled]: 'Cancelled',
        [FileUploadStage.Uploaded]: 'Images Uploaded Successfully',
        [FileUploadStage.Error]: 'Error',
        [FileUploadStage.NetworkError]: 'Network Error',
        [FileUploadStage.QueuedToUpload]: 'Images queued to upload',
      };

      return uploadStatusMessage[uploadStage] || 'Images Uploading';
    }
  };

  return {
    elapsedTime,
    uploadStage,
    onFilesSelected,
    uploadImagesProgressDetails,
    onCancelUpload,
    getImageUploadStatus,
  };
};
