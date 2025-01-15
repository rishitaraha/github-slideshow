import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api';
import { ApiErrorResponse, ApiResponse, CustomQueryType } from '../types';
import {
  projectListResponseMapper,
  projectPermissionPayloadMapper,
  projectResponseMapper,
} from './mappers';
import {
  AddProjectPayload,
  Project,
  ProjectList,
  ProjectListPayload,
  ProjectPermissionPayload,
  UpdateProjectPayload,
} from './types';

// APIs.
export const getProjectListRequest = async (
  payload?: ProjectListPayload,
): Promise<ApiResponse<ProjectList>> => {
  const res = await api.get<any, ApiResponse>(`/projects/`, {
    params: {
      search: payload?.searchQuery,
    },
  });
  res.data = projectListResponseMapper(res);
  return res;
};

export const getProjectRequest = async ({
  queryKey,
}): Promise<ApiResponse<Project>> => {
  const [, id] = queryKey;
  const res = await api.get<any, ApiResponse>(`/projects/${id}/`);
  res.data = projectResponseMapper(res.data);
  return res;
};

export const addProjectRequest = async (
  payload: AddProjectPayload,
): Promise<ApiResponse> => await api.post('/projects/', payload);

export const updateProjectRequest = async (
  payload: UpdateProjectPayload,
): Promise<ApiResponse<Project>> => {
  const { id } = payload;
  const res = await api.patch<any, ApiResponse>(`/projects/${id}/`, {
    name: payload.name,
  });
  return res;
};

export const projectPermissionRequest = async (
  payload: ProjectPermissionPayload,
): Promise<any> => {
  const res = await api.post(
    `/projects/${payload.id}/permission/`,
    projectPermissionPayloadMapper(payload),
  );
  return res;
};

// Hooks.
export const useProjectList = ({
  payload,
  enabled,
  ...rest
}: CustomQueryType<ProjectList> = {}) =>
  useQuery<any, ApiErrorResponse, ApiResponse<ProjectList>>({
    ...rest,
    queryKey: ['/projects/', payload],
    queryFn: () => getProjectListRequest(payload),
    enabled,
  });

export const useProject = (id: string) =>
  useQuery<any, ApiErrorResponse, ApiResponse<Project>>({
    queryKey: ['/project', id],
    queryFn: getProjectRequest,
    enabled: false,
  });

export const useAddProjectRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: async (payload: AddProjectPayload) =>
      addProjectRequest(payload),
  });

export const useUpdateProjectRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: updateProjectRequest,
  });

export const useProjectPermissionRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: async (payload: ProjectPermissionPayload) =>
      projectPermissionRequest(payload),
  });
