import { CheckBox } from '@aus-platform/design-system';
import { isEmpty } from 'lodash';
import { Dispatch, SetStateAction } from 'react';
import {
  OlLayerType,
  OlLayersType,
} from '../../../../shared/resources/openlayers';

type SwipeMapLayerListProps = {
  orthomosaicLayers: OlLayersType | null;
  layers: OlLayersType;
  setOrthomosaicLayers: Dispatch<SetStateAction<OlLayersType | null>>;
  setLayers: Dispatch<SetStateAction<OlLayersType>>;
};

export const SwipeMapLayerList: React.FC<SwipeMapLayerListProps> = ({
  orthomosaicLayers,
  layers,
  setOrthomosaicLayers,
  setLayers,
}) => {
  // Handlers.
  const onOrthoLayerClick = (orthoLayer: OlLayerType, id: string) => {
    const toggledOrthoLayer = {
      [id]: {
        ...orthoLayer,
        show: !orthoLayer.show,
      },
    };
    setOrthomosaicLayers({
      ...orthomosaicLayers,
      ...toggledOrthoLayer,
    });
    if (orthoLayer.tileLayer) {
      orthoLayer.tileLayer.setVisible(!orthoLayer.show);
    }
  };

  const onLayerClick = (layerId: string) => {
    setLayers({
      ...layers,
      [layerId]: { ...layers[layerId], show: !layers[layerId].show },
    });

    layers[layerId]?.tileLayer?.setVisible(!layers[layerId].show);
  };

  // Renders.
  return (
    <div className="swipe-map-layers__sidecard__layer-container">
      <div className="swipe-map-layers__sidecard__layer">
        <p className="swipe-map-layers__sidecard__layer__title">Base Layers</p>
        <div className="swipe-map-layers__sidecard__layer__list">
          {orthomosaicLayers && !isEmpty(orthomosaicLayers) ? (
            <>
              {Object.entries(orthomosaicLayers).map(([id, orthoLayer]) => {
                return (
                  <CheckBox
                    key={id}
                    title={orthoLayer.name}
                    showCard={true}
                    checked={orthoLayer.show}
                    onClick={() => onOrthoLayerClick(orthoLayer, id)}
                    disabled={orthoLayer.processing}
                    isLoading={orthoLayer.processing}
                  />
                );
              })}
            </>
          ) : (
            <p className="swipe-map-layers__sidecard__layer__list__empty-list">
              No base layer present.
            </p>
          )}
        </div>
      </div>
      <div className="swipe-map-layers__sidecard__layer">
        <p className="swipe-map-layers__sidecard__layer__title">Layers</p>
        <div className="swipe-map-layers__sidecard__layer__list">
          {!isEmpty(layers) ? (
            <>
              {Object.entries(layers).map(([id, layer]) => (
                <CheckBox
                  key={id}
                  title={layer.name}
                  checked={layer.show}
                  showCard={true}
                  onClick={() => onLayerClick(id)}
                  isLoading={layer.processing}
                  disabled={layer.processing}
                />
              ))}
            </>
          ) : (
            <p className="swipe-map-layers__sidecard__layer__list__empty-list">
              No layer present.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
