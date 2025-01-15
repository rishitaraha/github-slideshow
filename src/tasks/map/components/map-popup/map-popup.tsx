import {
  Icon,
  IconIdentifier,
  ColorClass,
  Tooltip,
} from '@aus-platform/design-system';
import React, { useState, useCallback } from 'react';
import { MapPopupProps } from '../../types';
import { MapLayerType } from '../../enums';

type PopupTextBodyProps = {
  header: string;
  value: string | number;
};

const PopupTextBody: React.FC<PopupTextBodyProps> = ({ header, value }) => {
  const [copied, setCopied] = useState(false);

  const onCopyClickHandler = useCallback(() => {
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    const timerId = setTimeout(() => setCopied(false), 1000);

    // Cleanup to prevent memory leaks
    return () => clearTimeout(timerId);
  }, [value]);

  return (
    <div className="map-popup-text__prop-box">
      <div className="map-popup-text__key">{header}</div>
      <div
        className="map-popup-text__value cursor-pointer"
        onClick={onCopyClickHandler}
      >
        {value} &nbsp;
        <Tooltip hoverText={copied ? 'Copied' : 'Copy'}>
          <Icon
            identifier={IconIdentifier.Copy}
            size={11}
            colorClass={ColorClass.AccentPrimary}
          />
        </Tooltip>
      </div>
    </div>
  );
};

const PopupHeaderMapping = {
  [MapLayerType.Geotag]: 'Geotag Details',
  [MapLayerType.AlignedImages]: 'Geotag Details',
  [MapLayerType.UnalignedImages]: 'Geotag Details',
  [MapLayerType.GCP]: 'GCP Details',
  [MapLayerType.UntaggedGCP]: 'GCP Details',
  [MapLayerType.UntaggedCheckpoint]: 'Checkpoint Details',
  [MapLayerType.Checkpoint]: 'Checkpoint Details',
};

const getActionButtonConfig = (popupType: MapLayerType) => {
  switch (popupType) {
    case MapLayerType.Geotag:
      return {
        icon: IconIdentifier.Image,
        text: 'View Image',
      };
    default:
      return {
        icon: IconIdentifier.GCPAvailableTagged,
        text: 'Tag Images',
      };
  }
};

export const MapPopup = React.forwardRef<HTMLDivElement, MapPopupProps>(
  (
    {
      id,
      name,
      popupType,
      showActionButton,
      onActionButtonClick,
      latitude,
      longitude,
      altitude,
    },
    ref,
  ) => {
    const headerText = PopupHeaderMapping[popupType] || 'Details';
    const actionButtonConfig = getActionButtonConfig(popupType);

    return (
      <div ref={ref} className="map-popup">
        <div className="map-popup-text">
          <div className="map-popup-text__header">
            <span>{headerText}</span>

            {showActionButton && (
              <span
                onClick={() => onActionButtonClick(id)}
                className="map-popup-text__header--button flex items-center"
              >
                <Icon
                  identifier={actionButtonConfig.icon}
                  colorClass={ColorClass.Primary500}
                  size={14}
                />
                &nbsp;
                {actionButtonConfig.text}
              </span>
            )}
          </div>
          <div className="map-popup-text__body">
            {[
              { header: 'Name', value: name },
              { header: 'Latitude', value: latitude },
              { header: 'Longitude', value: longitude },
              { header: 'Altitude', value: altitude },
            ].map(({ header, value }) => (
              <PopupTextBody key={header} header={header} value={value} />
            ))}
          </div>
        </div>
      </div>
    );
  },
);
