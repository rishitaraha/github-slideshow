import { AccessTagList, LayerType, User } from '../../shared/api';
import { LayersOptionType } from '../types';

export type LayerInput = {
  name: string;
  type: LayersOptionType | null;
  sourceId: string;
  accessTags?: string[];
  layerFile?: File | null;
  clampToTerrain?: boolean;
};

export type AccessTagType = {
  id: string;
  name: string;
};

export type AccessTagProps = {
  accessTags: AccessTagType[];
  setAccessTags: (accessTag: AccessTagType[]) => void;
  loggedUser: User | undefined;
  values: LayerInput;
  setValues: (value: LayerInput) => void;
  accessTagListResponse: AccessTagList | undefined;
};

// @TODO - remove captured dsm from the exclude.
export type LayerTypeLabel = {
  [key in Exclude<
    LayerType,
    | LayerType.Contour
    | LayerType.Cesium
    | LayerType.SlopeMap
    | LayerType.CapturedDsm
  >]: string;
};
