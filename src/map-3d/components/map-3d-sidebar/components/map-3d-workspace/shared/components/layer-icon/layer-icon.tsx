import {
  ColorClass,
  Icon,
  IconIdentifier,
  StatusIndicator,
  StatusIndicatorLevel,
} from '@aus-platform/design-system';
import { SelectLayerListItem, WorkspaceLayer } from '../../../../../shared';
import { LayerType } from 'shared/api';

type LayerIconType = {
  [key in LayerType]: {
    identifier: IconIdentifier;
    color: ColorClass;
  };
};

export const LayerIcon: React.FC<{
  layer: SelectLayerListItem | WorkspaceLayer;
}> = ({ layer }) => {
  // Constants.
  const layerIcon: LayerIconType = {
    [LayerType.CapturedDsm]: {
      identifier: IconIdentifier.DSM,
      color: ColorClass.AccentSuccess200,
    },
    [LayerType.Vector]: {
      identifier: IconIdentifier.LayerTypeVector,
      color: ColorClass.AccentPurple,
    },
    [LayerType.MapBox]: {
      identifier: IconIdentifier.LayerTypeVector,
      color: ColorClass.AccentPurple,
    },
    [LayerType.MBTiles]: {
      identifier: IconIdentifier.LayerTypeVector,
      color: ColorClass.AccentPurple,
    },
    [LayerType.Cesium]: {
      identifier: IconIdentifier.LayerTypeVector,
      color: ColorClass.AccentPurple,
    },
    [LayerType.SlopeMap]: {
      identifier: IconIdentifier.LayerTypeSlopeMap,
      color: ColorClass.AccentPurple,
    },
    [LayerType.Contour]: {
      identifier: IconIdentifier.LayerTypeContour,
      color: ColorClass.AccentPurple,
    },
    [LayerType.Orthomosaic]: {
      identifier: IconIdentifier.LayerTypeOrtho,
      color: ColorClass.Teal500,
    },
  };

  // Renders.
  return (
    <div className="layer-icon">
      {layer.layerStatus &&
      layer.layerStatus !== StatusIndicatorLevel.Done &&
      layer.layerStatus !== StatusIndicatorLevel.Completed ? (
        <StatusIndicator
          iconIdentifier={layerIcon[layer.type].identifier}
          iconColorClass={layerIcon[layer.type].color}
          status={layer.layerStatus}
          iconSize={22}
        />
      ) : (
        <Icon
          identifier={layerIcon[layer.type].identifier}
          colorClass={layerIcon[layer.type].color}
          size={22}
        />
      )}
    </div>
  );
};
