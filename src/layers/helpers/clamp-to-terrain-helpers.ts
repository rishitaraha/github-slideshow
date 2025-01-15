import { IconIdentifier, ColorClass } from '@aus-platform/design-system';
import { LayerClampedStatus } from '../../shared/api';
import { ClampedStateIndicator } from '../types';

export const getClampedStateIndicatorProps = (
  clampedStatus: LayerClampedStatus | undefined,
  hasDSM?: boolean,
): ClampedStateIndicator => {
  if (!hasDSM) {
    return {
      identifier: IconIdentifier.ClampDisabled,
      colorClass: ColorClass.AccentWarning,
      hoverText: 'No terrain available for clamping',
    };
  }
  switch (clampedStatus) {
    case LayerClampedStatus.Started:
    case LayerClampedStatus.Processing:
      return {
        identifier: IconIdentifier.ClampLoading,
        colorClass: ColorClass.AccentWarning,
        hoverText: 'Clamping to terrain',
      };
    case LayerClampedStatus.AlreadyClamped:
      return {
        identifier: IconIdentifier.ClampUnknown,
        colorClass: ColorClass.AccentWarning,
        hoverText: 'This layer was uploaded with existing z-elevation values',
      };
    case LayerClampedStatus.Failed:
      return {
        identifier: IconIdentifier.ClampDisabled,
        colorClass: ColorClass.AccentError,
        hoverText: 'This layer failed to clamp to the terrain layer',
      };
    case LayerClampedStatus.NotClamped:
      return {
        identifier: IconIdentifier.ClampDisabled,
        colorClass: ColorClass.AccentWarning,
        hoverText: 'This layer is not clamped to any terrain layer',
      };
    case LayerClampedStatus.Done:
      return {
        identifier: IconIdentifier.Clamp,
        colorClass: ColorClass.AccentSuccess,
        hoverText: 'Clamped to terrain',
      };
    default:
      return {
        identifier: IconIdentifier.ClampDisabled,
        colorClass: ColorClass.AccentWarning,
        hoverText: 'This layer is not clamped to any terrain layer',
      };
  }
};
