import {
  IconButton,
  IconButtonVariant,
  IconIdentifier,
  Placement,
  Tooltip,
} from '@aus-platform/design-system';
import classNames from 'classnames';
import { isNil } from 'lodash';
import BaseLayer from 'ol/layer/Base';

type SwipeMapBaseLayerProps = {
  baseLayer: BaseLayer;
  isLeftSideCardExpanded: boolean;
  isSatelliteLayerVisible: boolean;
  toggleSatelliteView: VoidFunction;
};

export const SwipeMapBaseLayer: React.FC<SwipeMapBaseLayerProps> = ({
  baseLayer,
  isSatelliteLayerVisible,
  toggleSatelliteView,
  isLeftSideCardExpanded,
}) => {
  // Constants.
  const swipeMapBaseLayerCustomClass = classNames([
    'swipe-map__base-layers',
    isLeftSideCardExpanded ? 'expanded' : '',
  ]);

  return (
    <div className={swipeMapBaseLayerCustomClass}>
      {!isNil(baseLayer) && (
        <Tooltip
          hoverText={
            isSatelliteLayerVisible
              ? 'Satellite basemap enabled'
              : 'Satellite basemap disabled'
          }
          placement={Placement.Right}
        >
          <div className="swipe-map__base-layers-container">
            <IconButton
              variant={IconButtonVariant.Secondary}
              iconIdentifier={
                isSatelliteLayerVisible
                  ? IconIdentifier.Earth
                  : IconIdentifier.EarthOff
              }
              active={isSatelliteLayerVisible}
              onClick={toggleSatelliteView}
              iconSize={24}
            />
          </div>
        </Tooltip>
      )}
    </div>
  );
};
