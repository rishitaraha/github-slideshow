import { isEmpty } from 'lodash';
import { MutableRefObject } from 'react';
import { uploadProcessIdLocalStorageManager } from '../image-upload-handler';
import { ProcessIdWithTimestamp } from '../types';
import { ProcessIdKeysInLocalStorage } from 'src/tasks/enums';

/**
 * Updates the timestamp in localStorage for the specified process ID every second.
 *
 * @param {string} processId - The ID of the process to update.
 * @param {MutableRefObject<NodeJS.Timeout | null>} localStorageTimestampIntervalId - A reference object that holds the interval ID for updating timestamps.
 */
export const updateTimeStampInLocalStorage = (
  processId: string,
  localStorageTimestampIntervalId: MutableRefObject<NodeJS.Timeout | null>,
) => {
  localStorageTimestampIntervalId.current = setInterval(() => {
    const localStorageProcessIdsWithTimestamps: ProcessIdWithTimestamp[] =
      uploadProcessIdLocalStorageManager.getProcessObject();
    if (localStorageProcessIdsWithTimestamps.length > 0) {
      const processObjIndex = localStorageProcessIdsWithTimestamps.findIndex(
        (processObj) => processObj.processId == processId,
      );
      if (processObjIndex > -1) {
        const currentTime = new Date();
        localStorageProcessIdsWithTimestamps[processObjIndex].lastUpdated =
          currentTime.getTime();
        uploadProcessIdLocalStorageManager.setProcessObject(
          localStorageProcessIdsWithTimestamps,
        );
      }
    }
  }, 1000);
};

/**
 * Adds a new process ID to localStorage with the current timestamp and begins updating the timestamp every second.
 *
 * @param {string} processId - The ID of the process to add.
 * @param {MutableRefObject<NodeJS.Timeout | null>} localStorageTimestampIntervalId - A reference object that holds the interval ID for updating timestamps.
 */
export const updateProcessId = (
  processId: string,
  localStorageTimestampIntervalId: MutableRefObject<NodeJS.Timeout | null>,
) => {
  const currentTime = new Date();
  const processObject: ProcessIdWithTimestamp = {
    processId: processId,
    lastUpdated: currentTime.getTime(),
  };
  const localStorageProcessIdsWithTimestamps: ProcessIdWithTimestamp[] =
    uploadProcessIdLocalStorageManager.getProcessObject();
  if (!isEmpty(localStorageProcessIdsWithTimestamps)) {
    localStorageProcessIdsWithTimestamps.push(processObject);
    uploadProcessIdLocalStorageManager.setProcessObject(
      localStorageProcessIdsWithTimestamps,
    );
  } else {
    uploadProcessIdLocalStorageManager.setProcessObject([processObject]);
  }
  updateTimeStampInLocalStorage(processId, localStorageTimestampIntervalId);
};

/**
 * Removes a process ID from localStorage and clears the timestamp update interval if the process ID matches the current one.
 *
 * @param {boolean} removeFromProcessIdRef - Whether to reset the processIdRef to an empty string.
 * @param {string} processId - The ID of the process to remove.
 * @param {MutableRefObject<NodeJS.Timeout | null>} localStorageTimestampIntervalId - A reference object that holds the interval ID for updating timestamps.
 * @param {MutableRefObject<string>} processIdRef - A reference object holding the current process ID.
 */
export const removeProcessId = (
  removeFromProcessIdRef: boolean,
  processId: string,
  localStorageTimestampIntervalId: MutableRefObject<NodeJS.Timeout | null>,
  processIdRef: MutableRefObject<string>,
) => {
  if (
    processId === processIdRef.current &&
    localStorageTimestampIntervalId.current
  ) {
    clearInterval(localStorageTimestampIntervalId.current);
  }
  if (removeFromProcessIdRef) {
    processIdRef.current = '';
  }
  if (ProcessIdKeysInLocalStorage.UploadProcessesQueue in localStorage) {
    const localStorageProcessIdsWithTimestamps: ProcessIdWithTimestamp[] =
      uploadProcessIdLocalStorageManager.getProcessObject();
    const updatedLocalStorageProcessIdsWithTimestamps =
      uploadProcessIdLocalStorageManager.removeProcessObject(
        localStorageProcessIdsWithTimestamps,
        processId,
      );

    uploadProcessIdLocalStorageManager.setProcessObject(
      updatedLocalStorageProcessIdsWithTimestamps,
    );
  }
};

/**
 * Removes process IDs from localStorage if they have not been updated in the last 30 seconds and do not match the current process ID.
 *
 * @param {ProcessIdWithTimestamp[]} localStorageProcessIdsWithTimestamps - Array of process IDs with timestamps from localStorage.
 * @param {MutableRefObject<NodeJS.Timeout | null>} localStorageTimestampIntervalId - A reference object that holds the interval ID for updating timestamps.
 * @param {MutableRefObject<string>} processIdRef - A reference object holding the current process ID.
 */
export const removeOrphanIds = (
  localStorageProcessIdsWithTimestamps: ProcessIdWithTimestamp[],
  localStorageTimestampIntervalId: React.MutableRefObject<NodeJS.Timeout | null>,
  processIdRef: React.MutableRefObject<string>,
) => {
  localStorageProcessIdsWithTimestamps
    .filter((processObj) => processObj.processId != processIdRef.current)
    .forEach((processObj) => {
      const currentTime = new Date();
      const lastUpdated = new Date(processObj.lastUpdated);
      const timeDiff = (currentTime.getTime() - lastUpdated.getTime()) / 1000;
      if (timeDiff > 30) {
        removeProcessId(
          false,
          processObj.processId,
          localStorageTimestampIntervalId,
          processIdRef,
        );
      }
    });
};
