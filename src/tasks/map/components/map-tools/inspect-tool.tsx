// InspectTool.tsx
import React from 'react';
import classNames from 'classnames';
import {
  Fab,
  IconIdentifier,
  Placement,
  Tooltip,
} from '@aus-platform/design-system';

type InspectToolProps = {
  activeTool: string;
  handleInspectToolClick: () => void;
  inspectState: { latitude: string; longitude: string; altitude: string };
};

export const InspectTool: React.FC<InspectToolProps> = ({
  activeTool,
  handleInspectToolClick,
  inspectState,
}) => {
  const isActive = activeTool === 'inspect';
  const activeButtonClass = classNames([
    'map-icon-button',
    { active: isActive },
  ]);

  return (
    <div className="tool-buttons">
      <Tooltip hoverText="Inspect Tool" placement={Placement.Right}>
        <Fab
          className={activeButtonClass}
          active={isActive}
          onClick={handleInspectToolClick}
          leftIconIdentifier={IconIdentifier.ExclamationCircle}
        />
      </Tooltip>
      {isActive && (
        <div className="qc-tooltip">
          <div className="qc-tooltip-text__prop-box">
            <div className="qc-tooltip-text__key">Latitude:</div>
            <div className="qc-tooltip-text__value">
              {inspectState.latitude}
            </div>
          </div>
          <div className="qc-tooltip-text__prop-box">
            <div className="qc-tooltip-text__key">Longitude:</div>
            <div className="qc-tooltip-text__value">
              {inspectState.longitude}
            </div>
          </div>
          <div className="qc-tooltip-text__prop-box">
            <div className="qc-tooltip-text__key">Altitude (m):</div>
            <div className="qc-tooltip-text__value">
              {inspectState.altitude}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
