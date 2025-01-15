import {
  IconButton,
  IconButtonVariant,
  IconIdentifier,
  Placement,
  Tooltip,
} from '@aus-platform/design-system';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { selectSwipeMap3D } from '../swipe-map-3d-slice';
import { SwipeMap3DBaseLayers } from '../swipe-map-3d-sidecard';
import { useAppSelector } from 'src/app/hooks';

export const SwipeMap3DBaseLayer = () => {
  // States.
  const [baseLayer, setBaseLayer] = useState<SwipeMap3DBaseLayers>({
    left: null,
    right: null,
  });

  // Selectors.
  const { splitViewer, isLeftSidecardOpen } = useAppSelector(selectSwipeMap3D);

  // Constants.
  const swipeMap3DBaseLayerCustomClass = classNames([
    'swipe-map-3d__base-layers',
    { 'move-by-left-sidecard': isLeftSidecardOpen },
  ]);

  const isSatelliteLayerVisible = baseLayer.left?.show;

  // Handlers.
  const onToggleSatelliteView = () => {
    if (baseLayer) {
      const { left: leftBaseLayer, right: rightBaseLayer } = baseLayer;

      if (leftBaseLayer && rightBaseLayer) {
        leftBaseLayer.show = !leftBaseLayer.show;
        rightBaseLayer.show = !rightBaseLayer.show;
        setBaseLayer({ left: leftBaseLayer, right: rightBaseLayer });
      }
    }
  };

  useEffect(() => {
    const baseLayers = splitViewer?.addBaseImageryLayers();
    if (baseLayers) {
      const { left: leftBaseLayer, right: rightBaseLayer } = baseLayers;
      setBaseLayer({ left: leftBaseLayer, right: rightBaseLayer });
    }
  }, [splitViewer]);

  return (
    <div className={swipeMap3DBaseLayerCustomClass}>
      {
        <Tooltip
          hoverText={
            isSatelliteLayerVisible
              ? 'Satellite basemap enabled'
              : 'Satellite basemap disabled'
          }
          placement={Placement.Right}
        >
          <div className="swipe-map-3d__base-layers-container">
            <IconButton
              variant={IconButtonVariant.Secondary}
              iconIdentifier={
                isSatelliteLayerVisible
                  ? IconIdentifier.Earth
                  : IconIdentifier.EarthOff
              }
              active={isSatelliteLayerVisible}
              onClick={onToggleSatelliteView}
              iconSize={24}
            />
          </div>
        </Tooltip>
      }
    </div>
  );
};
