import {
  Fab,
  IconIdentifier,
  Placement,
  Tooltip,
} from '@aus-platform/design-system';

export const ViewportCaptureButton = ({ handlePrint }) => {
  return (
    <Tooltip
      placement={Placement.Left}
      hoverText="Viewport Capture"
      className="viewport-capture__tooltip"
    >
      <Fab
        leftIconIdentifier={IconIdentifier.CameraFill}
        onClick={handlePrint}
      />
    </Tooltip>
  );
};
