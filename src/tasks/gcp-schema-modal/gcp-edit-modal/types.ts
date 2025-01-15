import { UseMutateFunction } from '@tanstack/react-query';
import { GCPTableRowData } from '../types';
import { ApiErrorResponse, ApiResponse, GCPUpdatePayload } from 'shared/api';

export type GCPEditModalProps = {
  show: boolean;
  close: () => void;
  currentRow: GCPTableRowData;
  isCRSGeographic: boolean;
  gcpUpdateQuery: {
    sendGCPUpdateRequest: UseMutateFunction<
      ApiResponse,
      ApiErrorResponse,
      GCPUpdatePayload,
      unknown
    >;
    isPendingGCPUpdate: boolean;
  };
};

export type GCPEditModalInput = {
  name: string;
  xCoordinate: string;
  yCoordinate: string;
  zCoordinate: string;
  isCRSGeographic: boolean;
};
