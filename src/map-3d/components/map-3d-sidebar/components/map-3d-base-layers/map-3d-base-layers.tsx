import { CardToggle, ColorCodes } from '@aus-platform/design-system';
import { Color, EllipsoidTerrainProvider } from 'cesium';
import { isNil } from 'lodash';
import { useEffect, useState } from 'react';
import { BaseLayerType } from './types';
import {
  addTerrainLayer,
  selectMap3DState,
  selectMap3dSidebar,
  selectMap3dWorkspace,
} from 'map-3d/shared/map-3d-slices';
import { useAppDispatch, useAppSelector } from 'app/hooks';

export const Map3DBaseLayer = () => {
  // Hooks.
  const dispatch = useAppDispatch();
  const { terrainProvider } = useAppSelector(selectMap3dWorkspace);
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const { activeSidebarOption } = useAppSelector(selectMap3dSidebar);

  // States.
  const [baseLayerState, setBaseLayer] = useState<BaseLayerType>();

  // useEffects.
  useEffect(() => {
    const imageryLayer = cesiumProxy?.cesiumViewer.viewer?.imageryLayers.get(0);

    if (imageryLayer) {
      setBaseLayer({
        name: 'Satellite',
        imageryLayer,
        show: imageryLayer.show,
      });
    }
  }, []);

  // Handlers.
  const onBaseLayerToggleClick = () => {
    if (!isNil(baseLayerState?.imageryLayer)) {
      setBaseLayer({
        ...baseLayerState,
        show: !baseLayerState.show,
      });

      baseLayerState.imageryLayer.show = !baseLayerState.show;

      if (baseLayerState.show && cesiumProxy) {
        cesiumProxy.setGlobeBaseColor(
          Color.fromCssColorString(ColorCodes.MapBackground),
        );
      }
    }
  };

  const onTerrainToggleClick = () => {
    if (terrainProvider) {
      dispatch(
        addTerrainLayer({
          ...terrainProvider,
          show: !terrainProvider?.show,
        }),
      );
      if (terrainProvider?.show) {
        cesiumProxy?.layerManager.setTerrainProvider(
          new EllipsoidTerrainProvider({}),
        );
      } else if (terrainProvider.terrainProvider) {
        cesiumProxy?.layerManager.setTerrainProvider(
          terrainProvider.terrainProvider,
        );
      }
    }
  };

  return (
    <>
      {activeSidebarOption?.isHidden && (
        <div className="base-map">
          {terrainProvider && (
            <CardToggle
              title="Terrain"
              active={terrainProvider.show}
              onClick={onTerrainToggleClick}
              isLoading={terrainProvider.processing}
              disabled={terrainProvider.processing}
            />
          )}
          {!isNil(baseLayerState?.imageryLayer) && (
            <CardToggle
              title={baseLayerState.name}
              active={baseLayerState.show}
              onClick={onBaseLayerToggleClick}
              isLoading={baseLayerState.processing}
              disabled={baseLayerState.processing}
              dataTestId="satellite-toggle-button"
            />
          )}
        </div>
      )}
    </>
  );
};
