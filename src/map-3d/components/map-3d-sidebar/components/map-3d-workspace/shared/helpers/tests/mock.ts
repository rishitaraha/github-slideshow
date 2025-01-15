import { ImageryLayer } from 'cesium';
import { v4 as uuid4 } from 'uuid';
import { WorkspaceLayer } from '../../../../../../../components';
import { AreaCategory, LayerType, SiteTypes } from 'shared/api';
import { CustomDate } from 'shared/utils';

export const mockWorkspaceLayer = (
  layer: Partial<WorkspaceLayer>,
): WorkspaceLayer => {
  const imageryLayer = ImageryLayer.fromWorldImagery({ show: layer.show });

  const workspaceLayer: WorkspaceLayer = {
    name: layer.name ?? 'Layer-Mock',
    id: layer.id ?? uuid4(),
    type: layer.type ?? LayerType.Vector,
    zIndex: layer.zIndex,
    show: layer.show ?? true,
    areaCategory: AreaCategory.Other,
    mapLayer: imageryLayer,
    createdAt: new CustomDate('2000-05-26'),
    canEditFeatures: false,
    project: {
      id: uuid4(),
      name: 'Project-1',
    },
    iteration: {
      id: uuid4(),
      name: 'Iteration-1',
      date: new CustomDate('2000-05-26'),
    },
    site: {
      id: uuid4(),
      name: 'Site-1',
      latitude: 0,
      longitude: 0,
      createdAt: new CustomDate('2000-05-26'),
      type: SiteTypes.MINE_SITE,
    },
  };
  return workspaceLayer;
};
