import {
  Fab,
  FabStack,
  IconIdentifier,
  FabOrientation,
  Tooltip,
  Placement,
} from '@aus-platform/design-system';
import { SceneMode } from 'cesium';
import classNames from 'classnames';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  selectMap3DState,
  setCurrentSceneMode,
} from '../../shared/map-3d-slices';

export type SceneModeSwitcherPropTypes = {
  isLeftSidecardOpen: boolean;
};

export const SceneModeSwitcher: React.FC<SceneModeSwitcherPropTypes> = ({
  isLeftSidecardOpen,
}) => {
  // Selector.
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const { currentSceneMode } = useAppSelector(selectMap3DState);

  const dispatch = useAppDispatch();

  // Custom classname.
  const customClassname = classNames([
    'scene-mode-switcher__container',
    isLeftSidecardOpen ? 'move-position' : '',
  ]);

  // Handlers.
  const onClick3D = () => {
    cesiumProxy?.switchTo3D();
    dispatch(setCurrentSceneMode(SceneMode.SCENE3D));
  };

  const onClick2D = () => {
    cesiumProxy?.switchTo2D();
    dispatch(setCurrentSceneMode(SceneMode.SCENE2D));
  };

  return (
    <div className={customClassname}>
      <div className="scene-mode-switcher">
        <FabStack orientation={FabOrientation.Horizontal}>
          <Tooltip
            hoverText={
              currentSceneMode === SceneMode.SCENE2D
                ? '2D View'
                : 'Switch to 2D View'
            }
            placement={Placement.Bottom}
          >
            <Fab
              leftIconIdentifier={IconIdentifier.Toggle2D}
              rightIconIdentifier={IconIdentifier.Text2D}
              active={currentSceneMode === SceneMode.SCENE2D}
              onClick={onClick2D}
              className="scene-mode-switcher__2d-button"
              data-testid="scene-mode-switcher-2d-button"
            />
          </Tooltip>

          <Tooltip
            hoverText={
              currentSceneMode === SceneMode.SCENE3D
                ? '3D View'
                : 'Switch to 3D View'
            }
            placement={Placement.Bottom}
          >
            <Fab
              onClick={onClick3D}
              leftIconIdentifier={IconIdentifier.Toggle3D}
              active={currentSceneMode === SceneMode.SCENE3D}
              rightIconIdentifier={IconIdentifier.Text3D}
              className="scene-mode-switcher__3d-button"
              data-testid="scene-mode-switcher-3d-button"
            />
          </Tooltip>
        </FabStack>
      </div>
    </div>
  );
};
