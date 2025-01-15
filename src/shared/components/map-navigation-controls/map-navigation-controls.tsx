import {
  Fab,
  FabStack,
  IconIdentifier,
  Placement,
  Tooltip,
  FabOrientation,
} from '@aus-platform/design-system';
import classNames from 'classnames';
import {
  BoundingBox,
  CesiumProxy,
  CesiumSplitViewerProxy,
} from 'shared/cesium';

type MapNavigationControlsProps = {
  cesiumProxy: CesiumProxy | CesiumSplitViewerProxy | null;
  className?: string;
  bounds?: BoundingBox;
};

export const MapNavigationControls: React.FC<MapNavigationControlsProps> = ({
  cesiumProxy,
  bounds,
  className,
}) => {
  // Constants.
  const navigationControlClassname = classNames(
    'map-navigation-controls',
    className,
  );

  // Renders.
  return (
    <FabStack
      className={navigationControlClassname}
      orientation={FabOrientation.Vertical}
    >
      <Tooltip hoverText="Zoom In" placement={Placement.Left}>
        <Fab
          leftIconIdentifier={IconIdentifier.Plus}
          className="map-navigation-controls__zoom-in"
          onClick={() => {
            cesiumProxy?.zoomIn();
          }}
        />
      </Tooltip>
      <Tooltip hoverText="Reset Zoom" placement={Placement.Left}>
        <Fab
          leftIconIdentifier={IconIdentifier.Reset}
          className="map-navigation-controls__reset-button"
          onClick={() => {
            cesiumProxy?.reset(bounds);
          }}
        />
      </Tooltip>
      <Tooltip hoverText="Zoom Out" placement={Placement.Left}>
        <Fab
          leftIconIdentifier={IconIdentifier.Minus}
          className="map-navigation-controls__zoom-out"
          onClick={() => {
            cesiumProxy?.zoomOut();
          }}
        />
      </Tooltip>
    </FabStack>
  );
};
