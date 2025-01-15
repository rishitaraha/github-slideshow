import { Pill, PillVariant } from '@aus-platform/design-system';
import {
  CellContext,
  ColumnDef,
  createColumnHelper,
} from '@tanstack/react-table';
import { GCPListColumnsData, GCPTableRowData } from '../types';
import { tableRowSelectColumn } from 'shared/components';

const columnHelper = createColumnHelper<GCPTableRowData>();

export const gcpListColumns = ({
  isCRSGeographic,
  renderActionItems,
  renderGCPToggle,
}: GCPListColumnsData): ColumnDef<GCPTableRowData, any>[] => {
  return [
    tableRowSelectColumn,
    columnHelper.accessor('sno', {
      size: 70,
      header: '#',
      enableSorting: false,
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor('label', {
      size: 180,
      header: 'Name',
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor('type', {
      size: 180,
      header: () => (
        <div
          className="gcp-table__header-loader"
          data-testid="gcp-table-type-header"
        >
          Type
        </div>
      ),

      cell: (info) => {
        const selectedRows = info.table.getSelectedRowModel().rows;
        const row = info.row.original;
        return renderGCPToggle(row, selectedRows);
      },
    }),
    columnHelper.accessor('yCoordinate', {
      size: 180,
      header: isCRSGeographic ? 'Latitude' : 'Northing',
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor('xCoordinate', {
      size: 180,
      header: isCRSGeographic ? 'Longitude' : 'Easting',
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor('zCoordinate', {
      size: 180,
      header: 'Altitude',
      cell: (info) => info.getValue(),
    }),

    columnHelper.accessor('numberOfImagesTagged', {
      header: 'Status',
      cell: (info) => {
        const numberOfImagesTagged = info.row.original.numberOfImagesTagged;
        const isTagged = numberOfImagesTagged > 0;
        const padNumber = (num: number) => {
          return String(num).padStart(2, '0');
        };
        const pillText = isTagged
          ? `${padNumber(numberOfImagesTagged)} Images tagged`
          : 'No Images tagged';

        return (
          <Pill
            variant={isTagged ? PillVariant.Success : PillVariant.Warning}
            className="m-0"
          >
            {pillText}
          </Pill>
        );
      },
    }),

    columnHelper.display({
      size: 180,
      id: 'actions',
      enableSorting: false,
      header: () => <div className="aus-table__action__header">Actions</div>,
      cell: (info: CellContext<GCPTableRowData, any>) => {
        const row = info.row.original;
        return renderActionItems(row);
      },
    }),
  ];
};
