import { SelectLayerListItem } from '../../../shared';
import {
  AddLayerResponse,
  FileDataType,
  IterationListItem,
  ProjectListItem,
  SiteListItem,
  WorkspaceResponseLayer,
} from 'shared/api';

export type WorkspaceLayerFiles = {
  rasterFile: FileDataType | undefined;
  vectorTiles: FileDataType | undefined;
};

export type CreateWorkspaceLayerParams = {
  layer: SelectLayerListItem | AddLayerResponse | WorkspaceResponseLayer;
  project: ProjectListItem;
  site: SiteListItem;
  iteration: IterationListItem;
};
