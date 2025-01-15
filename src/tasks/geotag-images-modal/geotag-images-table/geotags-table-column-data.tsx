import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { GeotagTableRowData } from '../types';
import { GeotagImageTableActions } from './geotag-images-table-actions';
import { CoordinatesName } from 'src/shared/enums';
import { tableRowSelectColumn } from 'src/shared/components';

const columnHelper = createColumnHelper<GeotagTableRowData>();

export const geotagsListColumnsGenerator = (
  isCRSGeographic: boolean,
): ColumnDef<GeotagTableRowData, any>[] => {
  const tableColumns = [
    tableRowSelectColumn,
    columnHelper.accessor('sno', {
      header: '#',
      size: 30,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('filename', {
      header: 'Name',
      minSize: 210,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('yCoordinate', {
      header: () =>
        isCRSGeographic ? (
          <>{CoordinatesName.Latitude}</>
        ) : (
          <>
            {CoordinatesName.Northing}{' '}
            <span className="text-lowercase">(m)</span>
          </>
        ),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('xCoordinate', {
      minSize: 210,
      header: () => (
        <span>
          {isCRSGeographic ? (
            <>{CoordinatesName.Longitude}</>
          ) : (
            <>
              {CoordinatesName.Easting}{' '}
              <span className="text-lowercase">(m)</span>
            </>
          )}
        </span>
      ),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('zCoordinate', {
      minSize: 210,
      header: () => (
        <>
          {CoordinatesName.Altitude} <span className="text-lowercase">(m)</span>
        </>
      ),
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="aus-table__action__header">Actions</div>,
      cell: (info) => {
        return <GeotagImageTableActions rowDetails={info.row.original} />;
      },
    }),
  ];
  return tableColumns;
};
