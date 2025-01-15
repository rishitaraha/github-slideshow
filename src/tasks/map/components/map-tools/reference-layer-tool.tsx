import {
  Fab,
  IconIdentifier,
  Placement,
  toast,
  Tooltip,
} from '@aus-platform/design-system';
import React from 'react';
import { createFeaturesFromGeoJson } from '../../helpers';
import { ViewLayer } from '../../types';

interface ReferenceLayerToolProps {
  handleReferenceToolClick: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  referenceLayer: ViewLayer;
}

export const ReferenceLayerTool: React.FC<ReferenceLayerToolProps> = ({
  handleReferenceToolClick,
  inputRef,
  referenceLayer,
}) => {
  return (
    <div className="tool-buttons">
      <Tooltip
        hoverText="Upload Reference layer (.geojson)"
        placement={Placement.Right}
      >
        <Fab
          onClick={handleReferenceToolClick}
          leftIconIdentifier={IconIdentifier.Upload}
        />
      </Tooltip>
      <input
        type="file"
        className="d-none"
        ref={inputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && file.name.endsWith('.geojson')) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const loadedGeoJsonFile = event.target?.result;
              if (loadedGeoJsonFile) {
                try {
                  const features = createFeaturesFromGeoJson(
                    loadedGeoJsonFile as string,
                  );
                  referenceLayer.layer.getSource()?.clear();
                  referenceLayer.layer.getSource()?.addFeatures(features);
                  referenceLayer.layer.setVisible(true);
                  toast.success('Reference Layer uploaded successfully');
                } catch {
                  toast.error('Reference Layer upload failed');
                }
              } else {
                toast.error('Error parsing GeoJSON file');
              }
            };
            reader.readAsText(file);
          }
        }}
        accept=".geojson"
      />
    </div>
  );
};
