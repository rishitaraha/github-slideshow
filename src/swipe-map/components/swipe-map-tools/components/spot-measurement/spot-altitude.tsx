import React from 'react';
import {
  Icon,
  IconIdentifier,
  Placement,
  Spinner,
  StatusIndicatorLevel,
  Tooltip,
} from '@aus-platform/design-system';
import { isNil, isNull } from 'lodash';
import { IterationListItem } from '../../../../../shared/api';
import { BatchJobStatus } from '../../../../../shared/enums';

type SpotAltitudeTextProps = {
  altitude: number | null;
  iteration: IterationListItem | null;
  isLoading: boolean;
};

export const SpotAltitudeText: React.FC<SpotAltitudeTextProps> = ({
  altitude,
  isLoading,
  iteration,
}) => {
  // Handle iteration errors.
  if (!iteration) {
    return 'ITR Not Selected';
  }

  // Handle DSM errors.
  let dsmTooltipText;
  if (isNil(iteration.capturedDsm)) {
    dsmTooltipText =
      'No DSM detected for selected Iteration. Please upload the DSM file and try again ';
  } else if (
    iteration.capturedDsm.status === StatusIndicatorLevel.Failed ||
    iteration.capturedDsmCog?.batchJob.status === BatchJobStatus.Failed
  ) {
    dsmTooltipText =
      'DSM processing for the selected iteration has encountered an error.';
  } else if (
    iteration.capturedDsm.status !== StatusIndicatorLevel.Done ||
    iteration.capturedDsmCog?.batchJob.status !== BatchJobStatus.Completed
  ) {
    dsmTooltipText = 'DSM processing for selected Iteration.';
  }

  if (dsmTooltipText) {
    return (
      <>
        DSM Not Found
        <Tooltip placement={Placement.Right} hoverText={dsmTooltipText}>
          {' '}
          <Icon identifier={IconIdentifier.ExclamationCircle} size={16} />
        </Tooltip>
      </>
    );
  }

  // Handle loading.
  if (isLoading) {
    return <Spinner />;
  }

  // Handle out of bounds error.
  if (isNull(altitude)) {
    return 'Out of Bounds';
  }

  return <>{altitude}</>;
};
