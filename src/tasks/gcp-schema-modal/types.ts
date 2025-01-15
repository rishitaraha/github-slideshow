import { OverrideProperties } from 'type-fest';
import { Row, RowSelectionState } from '@tanstack/react-table';
import { GCPTypeLabel } from '../enums';
import { GCPData } from 'shared/api';

export type GCPSchemaModalProps = {
  show: boolean;
  onClose: () => void;
};

export type GCPTableRowData = {
  sno: number;
  selectedRows: string;
} & OverrideProperties<GCPData, { type: GCPTypeLabel }>;

export type GCPActionItemsProps = {
  currentRow: GCPTableRowData;
  areImagesAvailable: boolean;
  setShowGCPEditModal: (show: boolean) => void;
  gotoGCPTagPage: (row: GCPTableRowData) => void;
  setCurrentRow: (currentRow: GCPTableRowData) => void;
};

export type GCPTypeToggleProps = {
  currentRow: GCPTableRowData;
  selectedRows: Row<GCPTableRowData>[];
  refetchGCPList: () => void;
  datasetId: string;
  setRowSelection: (selectedRow: RowSelectionState) => void;
};

export type GCPSchemaModalSubHeaderProps = {
  rowSelection: RowSelectionState;
  searchGCPState: {
    searchGCP: string;
    setSearchGCP: (gcp: string) => void;
  };
  downloadGCPData: VoidFunction;
  displayMapView: VoidFunction;
  displayGCPUploadModal: VoidFunction;
  displayDeleteConfirmationModal: VoidFunction;
};

export type GCPListColumnsData = {
  isCRSGeographic: boolean;
  renderActionItems: (row: GCPTableRowData) => JSX.Element;
  renderGCPToggle: (
    row: GCPTableRowData,
    selectedRows: Row<GCPTableRowData>[],
  ) => JSX.Element;
};
