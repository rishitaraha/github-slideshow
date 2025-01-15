// MeasureTools.tsx
import React from 'react';
import classNames from 'classnames';
import {
  ColorClass,
  Fab,
  IconIdentifier,
  Placement,
  Tooltip,
} from '@aus-platform/design-system';
import { MapMeasureInteraction } from '../../types';

type MeasureToolLayerConfig = {
  type: string;
  tool: string;
  viewStyleType: string;
  drawStyleType: any;
  iconIdentifier?: IconIdentifier;
};

type MeasureToolsProps = {
  activeTool: string;
  handleMeasureToolClick: () => void;
  measureLayersConfig: MeasureToolLayerConfig[];
  toolsToggleState: Record<string, boolean>;
  mapMeasureInteraction?: MapMeasureInteraction;
  clearMeasureInteractions: () => void;
  setToolsToggleState: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
};

export const MeasureTools: React.FC<MeasureToolsProps> = ({
  activeTool,
  handleMeasureToolClick,
  measureLayersConfig,
  toolsToggleState,
  mapMeasureInteraction,
  clearMeasureInteractions,
  setToolsToggleState,
}) => {
  const isActive = activeTool === 'measure';
  const activeButtonClass = classNames([
    'map-icon-button',
    { active: isActive },
  ]);

  return (
    <div className="tool-buttons">
      <Tooltip hoverText="Measure Tool" placement={Placement.Right}>
        <Fab
          className={activeButtonClass}
          onClick={handleMeasureToolClick}
          leftIconIdentifier={IconIdentifier.Measure}
          active={isActive}
        />
      </Tooltip>
      {isActive &&
        measureLayersConfig.map((measureToolLayer) => {
          const show = toolsToggleState[measureToolLayer.type] || false;
          const cls = classNames(['map-icon-button', { active: show }]);
          return (
            <Fab
              key={measureToolLayer.type}
              className={cls}
              active={show}
              onClick={() => {
                if (!mapMeasureInteraction) {
                  return;
                }

                const updated = { ...toolsToggleState };
                const drawObj =
                  mapMeasureInteraction[measureToolLayer.type].draw;
                const newState = !updated[measureToolLayer.type];

                Object.keys(updated).forEach((k) => {
                  updated[k] = false;
                  if (mapMeasureInteraction[k]) {
                    mapMeasureInteraction[k].draw.setActive(false);
                  }
                });

                updated[measureToolLayer.type] = newState;
                drawObj.setActive(newState);
                setToolsToggleState(updated);
              }}
              leftIconIdentifier={
                measureToolLayer.iconIdentifier ?? IconIdentifier.Bin
              }
            />
          );
        })}
      {isActive && (
        <Fab
          className="map-icon-button"
          leftIconIdentifier={IconIdentifier.Bin}
          onClick={() => {
            if (!mapMeasureInteraction) {
              return;
            }

            Object.values(mapMeasureInteraction).forEach((obj) => {
              obj.source.clear();
              obj.draw.setActive(false);
            });
            clearMeasureInteractions();
            setToolsToggleState({});
          }}
          color={ColorClass.Red500}
        />
      )}
    </div>
  );
};
