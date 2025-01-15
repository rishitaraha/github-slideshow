import { Placement, Tooltip } from '@aus-platform/design-system';
import { DatasetDetailsTooltipProps, TooltipTextProps } from './types';

const TooltipText: React.FC<TooltipTextProps> = ({
  layerName,
  siteName,
  iterationName,
}) => {
  return (
    <div className="dataset-details-tooltip">
      {layerName && (
        <div className="dataset-details-tooltip__grid-container">
          <div>Layer </div>
          <strong>{layerName}</strong>
        </div>
      )}
      {siteName && (
        <div className="dataset-details-tooltip__grid-container">
          <div>Site </div>
          <strong>{siteName}</strong>
        </div>
      )}
      {iterationName && (
        <div className="dataset-details-tooltip__grid-container">
          <div>Iteration </div>
          <strong>{iterationName}</strong>
        </div>
      )}
    </div>
  );
};

export const DatasetDetailsTooltip: React.FC<DatasetDetailsTooltipProps> = ({
  siteName,
  layerName,
  iterationName,
  children,
  placement = Placement.Right,
  show,
}) => {
  // Renders.
  return (
    <Tooltip
      hoverText={
        <TooltipText
          siteName={siteName}
          layerName={layerName}
          iterationName={iterationName}
        />
      }
      placement={placement}
      className="dataset-details-tooltip-container"
      show={show}
    >
      {children}
    </Tooltip>
  );
};
