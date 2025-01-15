import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { isEmpty } from 'lodash';
import { toast } from '@aus-platform/design-system';
import api from '../api';
import { ApiErrorResponse, ApiResponse } from '../types';
import { apiPayloadMapper } from '../utils';
import { mapTaskObject } from '../iteration-dataset/mapper';
import logServerApi from '../log-api';
import {
  CreateTaskPayload,
  RenameTaskPayload,
  Task,
  TaskOutputDownloadPayload,
} from './types';
import { EnvVariables } from 'src/shared/env-variables';
import { TokenManager } from 'src/shared/helpers';

// API.
export const createTaskRequest = async (
  payload: CreateTaskPayload,
): Promise<ApiResponse<Task>> => {
  const response = await api.post<ApiResponse, any>(
    'processing/tasks/',
    apiPayloadMapper(payload),
  );
  return {
    ...response,
    data: mapTaskObject(response.data.task),
  };
};

export const renameTaskRequest = async (
  payload: RenameTaskPayload,
): Promise<ApiResponse> =>
  await api.patch(`/processing/tasks/${payload.taskId}/rename/`, {
    name: payload.name,
  });

export const taskOutputDownloadRequest = async (
  payload: TaskOutputDownloadPayload,
): Promise<ApiResponse> =>
  await api.get<any, ApiResponse>(
    `/processing/tasks/${payload.taskId}/download/?download_type=${payload.type}`,
  );

export const getTaskLogDownloadsRequest = async (
  logStreamName: string,
  taskId: string,
): Promise<ApiResponse> => {
  return logServerApi.get<any, any>(`/download_logs`, {
    params: { stream: logStreamName, task_id: taskId, is_rainbow: true },
  });
};

export const cancelTaskRequest = async (taskId: string): Promise<ApiResponse> =>
  await api.patch(`/processing/tasks/${taskId}/cancel-task/`);

// Fetch Altitude from tileserver.
export const getPointAltitude = async (
  x: number,
  y: number,
  key: string,
  errorString?: string,
): Promise<number> => {
  try {
    return axios
      .get(
        EnvVariables.tileServerUrl +
          '/altitude' +
          `?key=${key}` +
          `&longitude=${x}` +
          `&latitude=${y}`,
        { headers: { Authorization: `Bearer ${TokenManager.getToken()}` } },
      )
      .then((res) => {
        if (res.data && !isEmpty(res.data)) {
          return res.data['data'][0];
        }
      })
      .catch(() => {
        if (!!errorString) {
          toast.warning(errorString);
        }
      });
  } catch (error) {
    return 0;
  }
};

// Hooks.
export const useCreateTaskRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, CreateTaskPayload>({
    mutationFn: async (payload: CreateTaskPayload) =>
      createTaskRequest(payload),
  });

export const useTask = (taskId: string, enabled: boolean) =>
  useQuery<ApiResponse<Task>>({
    queryKey: [`/processing/tasks/${taskId}/`],
    enabled,
  });

export const useRenameTaskRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, RenameTaskPayload>({
    mutationFn: async (payload: RenameTaskPayload) =>
      renameTaskRequest(payload),
  });

export const useCancelTask = (taskId: string) =>
  useMutation<ApiResponse, ApiErrorResponse>({
    mutationFn: async () => cancelTaskRequest(taskId),
  });

export const useTaskOutputDownloadRequest = (
  payload: TaskOutputDownloadPayload,
  enabled = false,
) =>
  useQuery<ApiResponse, ApiErrorResponse>({
    queryKey: [`/processing/tasks/${payload.taskId}/download`, payload],
    queryFn: () => taskOutputDownloadRequest(payload),
    retry: false,
    enabled,
  });

export const useDownloadTaskLogsRequest = (
  logStreamName: string,
  taskId: string,
) =>
  useQuery<ApiResponse, ApiErrorResponse>({
    queryKey: [`/tasks/${taskId}/download_logs`, logStreamName],
    queryFn: () => getTaskLogDownloadsRequest(logStreamName, taskId),
    enabled: false,
  });
