import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { ApiErrorResponse } from '../types';
import { IterationDatasetIdPayload } from '../iteration-dataset/types';
import { Preset } from './preset-types';

const presetBaseUrl = '/processing/presets/';

const getPresetListRequest = async (
  payload: IterationDatasetIdPayload,
): Promise<Preset[]> => {
  const queryParams = `iteration_dataset=${payload.iterationDatasetId}`;
  const response = await api.get(`${presetBaseUrl}?${queryParams}`);
  return response.data.presets.map((presetObj) => ({
    ...presetObj,
    value: JSON.parse(presetObj.value),
  }));
};

export const usePresetsListRequest = (
  payload: IterationDatasetIdPayload,
  enabled = false,
) =>
  useQuery<Preset[], ApiErrorResponse>({
    queryKey: [presetBaseUrl, payload],
    queryFn: () => getPresetListRequest(payload),
    enabled,
  });
