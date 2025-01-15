import { FC, useEffect } from 'react';
import { toast, ToggleSwitch } from '@aus-platform/design-system';
import { GCPTypeToggleProps } from '../types';
import { GCPTypeLabel } from 'src/tasks/enums';
import { useGCPBulkUpdate, handleResponseErrorMessage } from 'shared/api';
import { GcpLabelToType } from 'src/tasks/constants';

export const GCPTypeToggleSwitch: FC<GCPTypeToggleProps> = ({
  currentRow,
  selectedRows,
  refetchGCPList,
  datasetId,
  setRowSelection,
}) => {
  // API's
  const {
    mutate: sendGCPBulkUpdateRequest,
    data: gcpBulkUpdateResponse,
    isSuccess: isSuccessGCPBulkUpdate,
    isError: isErrorGCPBulkUpdate,
    error: gcpBulkUpdateError,
  } = useGCPBulkUpdate();

  // useEffect
  useEffect(() => {
    if (isSuccessGCPBulkUpdate && gcpBulkUpdateResponse) {
      setRowSelection({});
      toast.success('GCP updated successfully!');
      refetchGCPList();
    } else {
      handleResponseErrorMessage(isErrorGCPBulkUpdate, gcpBulkUpdateError);
    }
  }, [
    isSuccessGCPBulkUpdate,
    gcpBulkUpdateResponse,
    isErrorGCPBulkUpdate,
    gcpBulkUpdateError,
  ]);

  // Variables.
  const isToggleTypeGCP = currentRow.type === GCPTypeLabel.GCP;

  return (
    <div className="toggle-switch-container">
      <ToggleSwitch
        leftTitle={GCPTypeLabel.GCP}
        rightTitle={GCPTypeLabel.CHECKPOINT}
        leftSelected={isToggleTypeGCP}
        onChange={(toggledValue: string) => {
          let toggledRowsId = selectedRows.map((row) => row.original.id);

          if (!toggledRowsId.includes(currentRow.id)) {
            toggledRowsId = [currentRow.id];
          }

          sendGCPBulkUpdateRequest({
            iterationDataset: datasetId,
            type: GcpLabelToType[toggledValue],
            gcpIds: toggledRowsId,
          });
        }}
      />
    </div>
  );
};
