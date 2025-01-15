import { FC, useEffect } from 'react';
import { Icon, IconIdentifier, toast } from '@aus-platform/design-system';
import { GCPDeleteModalProps } from './type';
import { useIterationDatasetContext } from 'src/tasks/contexts';
import { ConfirmationModal } from 'shared/components';
import { handleResponseErrorMessage, useGcpBulkDelete } from 'src/shared/api';

export const GCPDeleteModal: FC<GCPDeleteModalProps> = ({
  hideDeleteModal,
  rowSelection,
  setRowSelection,
  refetchGCPList,
}) => {
  // Api.
  const {
    mutate: sendBulkDeleteGCPRequest,
    error: bulkDeleteGcpDataError,
    isPending: isLoadingBulkDeleteGCP,
    isSuccess: isSuccessBulkDeleteGCP,
    isError: isErrorBulkDeleteGCP,
  } = useGcpBulkDelete();

  // Context
  const { iterationDataset } = useIterationDatasetContext();

  // Constants.
  const selectedGCPIds = Object.keys(rowSelection);

  // useEffect.
  useEffect(() => {
    if (isSuccessBulkDeleteGCP) {
      hideDeleteModal();
      refetchGCPList();
      toast.success('GCPs deleted successfully.');
      setRowSelection({});
    } else if (isErrorBulkDeleteGCP) {
      handleResponseErrorMessage(isErrorBulkDeleteGCP, bulkDeleteGcpDataError);
    }
  }, [isSuccessBulkDeleteGCP, isErrorBulkDeleteGCP]);

  // Handler.
  const handleOnDelete = () => {
    sendBulkDeleteGCPRequest({
      iterationDataset: iterationDataset.id,
      gcpIds: selectedGCPIds,
    });
  };

  return (
    <ConfirmationModal
      title="Delete Confirmation"
      message={
        <div className="gcp-delete-modal__message-container">
          <div>{selectedGCPIds.length} GCP(s) selected</div>
          <div>Are you sure you want to delete selected GCP(s)?</div>
          <div className="gcp-delete-modal__message-warning">
            <Icon identifier={IconIdentifier.Warning} size={18} />
            <div>Selected data will be permanently deleted </div>
          </div>
        </div>
      }
      className="gcp-delete-modal"
      onSubmit={handleOnDelete}
      isConfirmButtonLoading={isLoadingBulkDeleteGCP}
      onClose={hideDeleteModal}
      confirmText="Delete"
      isConfirmDanger
    />
  );
};
