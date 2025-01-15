import classNames from 'classnames';
import { get, isNumber } from 'lodash';
import XYZ from 'ol/source/XYZ';
import React, { useEffect, useState } from 'react';

import { Input, SliderComponent } from '@aus-platform/design-system';
import { ViewLayerType } from '../../types';
import { MapLayerType } from '../../enums';
import { Histogram, viridis2ColorMap } from 'src/shared/components';
import { tileLoadFunction } from 'src/shared/api';

const LayerOpacitySlider = ({ layer }) => {
  // States.
  const [opacityValue, setOpacityValue] = useState(100);

  // Handlers.
  const sliderHandler = (evt: React.FormEvent<HTMLInputElement>) => {
    evt.stopPropagation();
    const value = (evt.target as HTMLInputElement).value;
    setOpacityValue(Number(value));
    layer.setOpacity(Number(value) / 100);
  };

  return (
    <>
      <div className="layer-item__heading">Opacity</div>
      <div className="layer-item__opacity-box">
        <div className="layer-item__opacity-slider">
          <SliderComponent
            onChange={(value) => {
              if (isNumber(value)) {
                setOpacityValue(value);
                layer.setOpacity(value / 100);
              }
            }}
            value={opacityValue}
          />
        </div>
        <Input.Text
          className="layer-item__opacity-txt-box"
          value={opacityValue}
          onChange={sliderHandler}
        />
      </div>
    </>
  );
};

const LayerSelection = ({ viewLayer }: { viewLayer: ViewLayerType }) => {
  // Variables.
  const { layer } = viewLayer;
  const layerVisible = layer.getVisible();

  // States.
  const [inputChecked, setInputChecked] = useState(layerVisible);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [showHistogram, setShowHistogram] = useState(false);

  // useEffect.
  useEffect(() => {
    if (viewLayer.type === MapLayerType.SurfaceModel) {
      setShowHistogram(true);
      setShowOpacitySlider(true);
    }

    if (viewLayer.type === MapLayerType.Orthomosaic) {
      setShowOpacitySlider(true);
    }
  }, []);

  // Class names.
  const selectionBoxClassName = classNames([
    'layer-item__txt-box',
    {
      active: inputChecked,
    },
  ]);

  // Handlers.
  const onLayerItemClick = () => {
    layer.setVisible(!inputChecked);
    layer.getSource().changed();
    setInputChecked((prev) => !prev);
  };

  const rescale = get(layer.getProperties(), 'rescale', ',');
  const statistics = get(layer.getProperties(), 'statistics', {});

  const dsmRescaleUpdate = (event: string) => {
    const histogramUrl = layer.getSource().urls[0];
    const histogramRescale = histogramUrl.match(/rescale=([^&]+)/);
    const currentHistogramRescaleValue = histogramRescale
      ? histogramRescale[1]
      : null;

    const isRescaleChanged = currentHistogramRescaleValue !== event;

    if (isRescaleChanged) {
      // Replacing the rescale value to fetch the updated histogram.
      layer.setSource(
        new XYZ({
          url: histogramUrl.replace(/(rescale=)[^&]+/, `$1${event}`),
          crossOrigin: 'Anonymous',
          tileLoadFunction,
        }),
      );
    }
  };

  return (
    <div className="layer-item cursor-pointer">
      <div className={selectionBoxClassName} onClick={onLayerItemClick}>
        <Input.CheckBox checked={inputChecked} onChange={() => {}} />
        <span>{viewLayer.name ?? viewLayer.type}</span>
      </div>
      {inputChecked && (
        <>
          {showOpacitySlider && <LayerOpacitySlider layer={layer} />}
          {showHistogram && (
            <>
              <div className="line"></div>
              <div className="layer-item__heading">Elevation</div>
              <Histogram
                colorMap={viridis2ColorMap}
                statistics={statistics}
                onChangeHistogramRescale={dsmRescaleUpdate}
                rescale={rescale}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export const ViewLayersTool = ({
  viewLayers,
  showViewLayersTool,
}: {
  viewLayers: ViewLayerType[];
  showViewLayersTool: boolean;
}) => {
  return (
    <div
      className="map-layers-overlay card"
      style={{ visibility: showViewLayersTool ? 'visible' : 'hidden' }}
    >
      <div className="map-layers-overlay__title">Layers</div>
      {viewLayers.map((viewLayer: ViewLayerType, key) => (
        <LayerSelection {...{ viewLayer }} key={key} />
      ))}
    </div>
  );
};
