import { Fab, IconIdentifier } from '@aus-platform/design-system';
import { Map as OlMap } from 'ol';
import Overlay from 'ol/Overlay';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapPopup, ViewLayersTool } from './components';
import { CursorStyle, MapLayerType } from './enums';
import { addOverlayPopups, createBaseMapObject } from './helpers';
import { useMapMeasureTools } from './hooks/use-tool-manager';
import { MapComponentProps, MapPopupProps } from './types';

export const initialOverlayPopupDetails = {
  popupType: MapLayerType.Geotag,
  name: '',
  id: '',
  showActionButton: false,
  onActionButtonClick: () => {},
  latitude: 0,
  longitude: 0,
  altitude: 0,
};

export const MapComponent: React.FC<MapComponentProps> = ({
  viewLayers,
  showMeasureTool = false,
}) => {
  const [cursorStyle, setCursorStyle] = useState<CursorStyle>(CursorStyle.Auto);
  const mapRenderRef = useRef<HTMLDivElement>(null);
  const popupOverlayRef = useRef<Overlay>();
  const popupElementRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<OlMap>();

  const [overlayPopupDetails, setOverlayPopupDetails] = useState<MapPopupProps>(
    initialOverlayPopupDetails,
  );
  const [showViewLayersTool, setShowViewLayersTool] = useState(false);

  const {
    renderAllTools,
    disableAllTools,
    updateInspectToolState,
    referenceLayer,
  } = useMapMeasureTools({
    setCursorStyle,
    map: mapInstance,
  });

  // Initialize map
  useEffect(() => {
    if (!mapRenderRef.current) {
      return;
    }

    const mapObject = createBaseMapObject(mapRenderRef);
    mapObject.setTarget(mapRenderRef.current);
    setMapInstance(mapObject);

    // Add view layers
    viewLayers.forEach((viewLayer) => {
      const { visible, layer, isExtent, extent } = viewLayer;
      mapObject.addLayer(layer);
      layer.setVisible(visible);

      if (isExtent && extent) {
        mapObject.getView().fit(extent);
      }
    });

    // Add reference layer
    mapObject.addLayer(referenceLayer.layer);

    // Add popup overlay
    addOverlayPopups(
      mapObject,
      setOverlayPopupDetails,
      popupOverlayRef,
      popupElementRef,
    );

    // Cleanup
    return () => {
      disableAllTools();
      mapObject.setTarget(undefined);
    };
  }, []);

  // Handle map click events
  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    const clickHandler = async (event: any) => {
      await updateInspectToolState(event, 'demS3ObjectKey');
    };

    mapInstance.on('click', clickHandler);

    return () => {
      mapInstance.un('click', clickHandler);
    };
  }, [mapInstance, updateInspectToolState]);

  const toggleViewLayersTool = useCallback(() => {
    setShowViewLayersTool((prev) => !prev);
  }, []);

  return (
    <div ref={mapRenderRef} className="ol-map" style={{ cursor: cursorStyle }}>
      <Fab
        leftIconIdentifier={
          showViewLayersTool ? IconIdentifier.LayerFilled : IconIdentifier.Layer
        }
        active={showViewLayersTool}
        className="map-layers-button"
        onClick={toggleViewLayersTool}
      />

      {showMeasureTool && renderAllTools()}

      <ViewLayersTool
        viewLayers={viewLayers}
        showViewLayersTool={showViewLayersTool}
      />

      <MapPopup ref={popupElementRef} {...overlayPopupDetails} />
    </div>
  );
};

export const Map = React.memo(MapComponent);
