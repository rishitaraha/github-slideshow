import { getCoreRowModel } from '@tanstack/react-table';

import { Table } from '@aus-platform/design-system';
import { useGeotagImagesContext } from '../../contexts';
import { EditGeotagsModal } from '../geotag-images-edit-modal';
import { DeleteGeotagModal } from '../delete-geotags-modal';
import { GeotagImagesTableHeader } from './geotag-images-table-header';
import { ToggleImagesGeotagsModal } from './geotag-images-table-toggle-modal';
import { geotagsListColumnsGenerator } from './geotags-table-column-data';
import { EmptyGeotagsList } from './geotags-empty-list';

export const GeotagImagesTable: React.FC = () => {
  const {
    geotagImages,
    paginationProps,
    setPaginationProps,
    rowSelection,
    setRowSelection,
    showToggleGeotagImagesModal,
    showEditGeotagImagesModal,
    showDeleteModal,
    pageCount,
    isCRSGeographic,
    isLoading,
  } = useGeotagImagesContext();

  const onPageSizeChange = (option) => {
    setPaginationProps({
      pageIndex: 0,
      pageSize: option.value,
    });
  };

  const geotagRowClassGenerator = (row) => {
    const isRowValid =
      !!row.xCoordinate && !!row.yCoordinate && !!row.zCoordinate;
    return `geotag-images-modal__table-row${!isRowValid && '__warning'}`;
  };

  return (
    <>
      <GeotagImagesTableHeader />
      <Table
        columns={geotagsListColumnsGenerator(isCRSGeographic)}
        data={geotagImages}
        getCoreRowModel={getCoreRowModel()}
        rowClassesGenerator={geotagRowClassGenerator}
        onRowSelectionChange={setRowSelection}
        onPaginationChange={setPaginationProps}
        enableColumnResizing={false}
        enableCustomRowClasses
        rowIdentifier={'id'}
        emptyListComponent={<EmptyGeotagsList />}
        {...{
          rowSelection,
          paginationProps,
          pageCount,
          onPageSizeChange,
          isLoading,
        }}
      />
      {showToggleGeotagImagesModal && <ToggleImagesGeotagsModal />}
      {showEditGeotagImagesModal && <EditGeotagsModal />}
      {showDeleteModal && <DeleteGeotagModal />}
    </>
  );
};
