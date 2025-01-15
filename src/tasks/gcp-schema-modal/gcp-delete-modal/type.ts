import { RowSelectionState } from '@tanstack/react-table';

export type GCPDeleteModalProps = {
  rowSelection: RowSelectionState;
  refetchGCPList: VoidFunction;
  hideDeleteModal: VoidFunction;
  setRowSelection: (value) => void;
};
