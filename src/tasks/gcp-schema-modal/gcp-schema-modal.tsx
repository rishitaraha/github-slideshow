import {
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
  paginationInitialState,
  SelectOption,
  Table,
  toast,
} from '@aus-platform/design-system';
import {
  getCoreRowModel,
  PaginationState,
  Row,
  RowSelectionState,
} from '@tanstack/react-table';
import { FC, useEffect, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { SingleValue } from 'react-select';
import { saveAs } from 'file-saver';
import { UploadGCPModal } from '../upload-gcp-modal';
import { GcpTypeToLabel } from '../constants';
import { GCPModalView } from '../enums';
import { useIterationDatasetContext } from '../contexts';
import { ViewGeotagGcpMapPreview } from '../view-geotag-gcp-map';
import { GCPSchemaModalProps, GCPTableRowData } from './types';
import { gcpListColumns } from './helpers/gcp-list-column-data';
import { GCPSchemaModalSubHeader } from './helpers/gcp-schema-modal-sub-header';
import { GCPActionItems } from './helpers/gcp-action-items';
import { GCPTypeToggleSwitch } from './helpers/gcp-type-toggle-switch';
import { GCPImageTaggingModal } from './gcp-image-tagging/gcp-image-tagging';
import { GCPEditModal } from './gcp-edit-modal';
import { GCPDeleteModal } from './gcp-delete-modal';
import { EPSGCode } from 'shared/enums';
import { EmptyList } from 'src/shared/components';
import {
  GCPData,
  handleResponseErrorMessage,
  queryClient,
  useGcpDownloadRequest,
  useGCPList,
  useGCPUpdate,
} from 'shared/api';

export const GCPSchemaModal: FC<GCPSchemaModalProps> = ({ show, onClose }) => {
  // Context
  const { iterationDataset } = useIterationDatasetContext();

  const [paginationProps, setPaginationProps] = useState<PaginationState>(
    paginationInitialState,
  );
  const [pageCount, setPageCount] = useState(0);
  const [searchGCP, setSearchGCP] = useState('');
  const [tableData, setTableData] = useState<GCPTableRowData[]>([]);
  const [modalViewPage, setModalViewPage] = useState<GCPModalView>(
    GCPModalView.TableView,
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showGCPEditModal, setShowGCPEditModal] = useState(false);
  const [currentRow, setCurrentRow] = useState<GCPTableRowData>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGCPUploadModal, setShowGCPUploadModal] = useState(false);
  const [hasUnsavedGcpTagChanges, setHasUnsavedGcpTagChanges] = useState(false);
  const [showGCPExitConfirmationModal, setShowGCPExitConfirmationModal] =
    useState(false);

  // Constants.
  const isCRSGeographic = iterationDataset.gcpHorizontalCrs === EPSGCode.WGS84;
  const areImagesAvailable = iterationDataset.numberOfImages > 0;

  // Apis.
  const {
    data: gcpListResponse,
    isPending: isPendingGCPList,
    isSuccess: isSuccessGCPList,
    refetch: refetchGCPList,
  } = useGCPList({
    iterationDataset: iterationDataset?.id,
    pageNumber: paginationProps.pageIndex + 1,
    pageSize: paginationProps.pageSize,
    search: searchGCP,
  });

  const {
    mutate: sendGCPUpdateRequest,
    data: gcpUpdateResponse,
    isPending: isPendingGCPUpdate,
    isSuccess: isSuccessGCPUpdate,
    isError: isErrorGCPUpdate,
    error: gcpUpdateError,
  } = useGCPUpdate();

  const {
    data: downloadGcpResponse,
    isSuccess: isSuccessDownloadGcpRequest,
    isError: isErrorDownloadGcpRequest,
    refetch: downloadGCPData,
  } = useGcpDownloadRequest({ iterationDataset: iterationDataset?.id }, false);

  // useEffect.
  useEffect(() => {
    if (isSuccessGCPList && gcpListResponse) {
      const newTableData = gcpListResponse.data.gcps.map(
        (gcp: GCPData, index) => {
          const gcpRow: GCPTableRowData = {
            ...gcp,
            sno:
              index + 1 + paginationProps.pageIndex * paginationProps.pageSize,
            type: GcpTypeToLabel[gcp.type],
          } as GCPTableRowData;

          return gcpRow;
        },
      );

      setPageCount(
        Math.ceil(gcpListResponse.data.total / paginationProps.pageSize),
      );
      setTableData(newTableData);
    }
  }, [gcpListResponse, isPendingGCPList, isSuccessGCPList]);

  useEffect(() => {
    if (isSuccessGCPUpdate && gcpUpdateResponse) {
      refetchGCPList();
      toast.success('GCP updated successfully!');
    } else if (isErrorGCPUpdate && gcpUpdateError) {
      handleResponseErrorMessage(isErrorGCPUpdate, gcpUpdateError);
    }

    showGCPEditModal && setShowGCPEditModal(false);
  }, [isSuccessGCPUpdate, gcpUpdateResponse]);

  useEffect(() => {
    if (
      isSuccessDownloadGcpRequest &&
      downloadGcpResponse &&
      iterationDataset
    ) {
      saveAs(new Blob([downloadGcpResponse]), iterationDataset.id + '_gcp.csv');
      queryClient.removeQueries({
        queryKey: [
          'processing/gcps/download/',
          {
            iterationDataset: iterationDataset.id,
          },
        ],
      });
    }
    if (isErrorDownloadGcpRequest) {
      handleResponseErrorMessage(
        isErrorDownloadGcpRequest,
        downloadGcpResponse,
      );
    }
  }, [isSuccessDownloadGcpRequest, downloadGcpResponse]);

  // Handlers.
  const hideExitConfirmationModal = () =>
    setShowGCPExitConfirmationModal(false);
  const displayExitConfirmationModal = () =>
    setShowGCPExitConfirmationModal(true);

  const displayDeleteModal = () => setShowDeleteModal(true);
  const hideDeleteModal = () => setShowDeleteModal(false);

  const displayGCPUploadModal = () => setShowGCPUploadModal(true);

  const onPageSizeChange = (option: SingleValue<SelectOption<number>>) => {
    if (option) {
      setPaginationProps({
        pageIndex: 0,
        pageSize: option.value,
      });
    }
  };

  const hideGcpUploadModal = () => {
    refetchGCPList();
    setShowGCPUploadModal(false);
  };

  const handleExitGcpTagging = () => {
    refetchGCPList();
    setModalViewPage(GCPModalView.TableView);
  };

  const showGCPTableView = () => {
    if (hasUnsavedGcpTagChanges) {
      displayExitConfirmationModal();
    } else {
      handleExitGcpTagging();
    }
  };

  const handleCloseGcpModal = () => {
    if (hasUnsavedGcpTagChanges) {
      displayExitConfirmationModal();
    } else {
      onClose();
    }
  };

  const gotoGCPTagPage = (currentRow: GCPTableRowData) => {
    setModalViewPage(GCPModalView.TaggingView);
    setCurrentRow(currentRow);
  };

  const displayMapView = () => setModalViewPage(GCPModalView.MapView);

  const onClickGcpImagePoint = (e) => {
    const selectedGcp = tableData.find((row) => row.id === e);
    if (selectedGcp) {
      gotoGCPTagPage(selectedGcp);
    }
  };

  // Render.
  const renderGCPToggle = (
    currentRow: GCPTableRowData,
    selectedRows: Row<GCPTableRowData>[],
  ) => {
    if (iterationDataset) {
      return (
        <GCPTypeToggleSwitch
          datasetId={iterationDataset.id}
          setRowSelection={setRowSelection}
          {...{ currentRow, selectedRows, refetchGCPList }}
        />
      );
    }
    return <></>;
  };

  const renderActionItems = (currentRow: GCPTableRowData) => (
    <GCPActionItems
      currentRow={currentRow}
      setShowGCPEditModal={setShowGCPEditModal}
      {...{ setCurrentRow, gotoGCPTagPage, areImagesAvailable }}
    />
  );

  const renderGcpTaggingView = () =>
    currentRow && (
      <GCPImageTaggingModal
        gcpRowData={currentRow}
        onDoneCallback={handleExitGcpTagging}
        {...{
          showGCPExitConfirmationModal,
          hideExitConfirmationModal,
          displayExitConfirmationModal,
          setHasUnsavedGcpTagChanges,
        }}
      />
    );

  const renderModalHeader = () => {
    return (
      <div className="d-flex">
        <div className="align-content-center">
          {modalViewPage !== GCPModalView.TableView && (
            <Button variant={ButtonVariant.Link}>
              <Icon
                className="geotags-modal__icon mr-5 cursor"
                identifier={IconIdentifier.ArrowLeft}
                colorClass={ColorClass.Neutral300}
                onClick={showGCPTableView}
              />
            </Button>
          )}
        </div>
        <div className="align-content-center">Ground Control Points (GCP)</div>
      </div>
    );
  };

  const renderGCPTableView = () => (
    <>
      <GCPSchemaModalSubHeader
        rowSelection={rowSelection}
        searchGCPState={{ searchGCP, setSearchGCP }}
        downloadGCPData={downloadGCPData}
        displayGCPUploadModal={displayGCPUploadModal}
        displayMapView={displayMapView}
        displayDeleteConfirmationModal={displayDeleteModal}
      />
      <Table
        columns={gcpListColumns({
          isCRSGeographic,
          renderActionItems,
          renderGCPToggle,
        })}
        data={tableData}
        getCoreRowModel={getCoreRowModel()}
        paginationProps={paginationProps}
        pageCount={pageCount}
        onPaginationChange={setPaginationProps}
        onPageSizeChange={(option) =>
          onPageSizeChange(option as SingleValue<SelectOption<number>>)
        }
        onRowSelectionChange={setRowSelection}
        isLoading={isPendingGCPList}
        emptyListComponent={
          <EmptyList
            iconIdentifier={IconIdentifier.GCPUnavailable}
            headingText="There are no GCP present"
            bodyText="We couldn't find what you were looking for"
          />
        }
        rowSelection={rowSelection}
        enableColumnResizing={false}
        enableRowSelection
        enableCustomRowClasses
        enableSorting
      />
      {currentRow && (
        <GCPEditModal
          isCRSGeographic={isCRSGeographic}
          show={showGCPEditModal}
          close={() => setShowGCPEditModal(false)}
          currentRow={currentRow}
          gcpUpdateQuery={{ sendGCPUpdateRequest, isPendingGCPUpdate }}
        />
      )}
      {showDeleteModal && (
        <GCPDeleteModal
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          refetchGCPList={refetchGCPList}
          hideDeleteModal={hideDeleteModal}
        />
      )}
    </>
  );

  return (
    <>
      <Modal
        show={show}
        className="gcp-schema-modal"
        dialogClassName="gcp-schema-modal"
        keyboard
        centered
        onHide={handleCloseGcpModal}
      >
        <Modal.Header closeButton> {renderModalHeader()}</Modal.Header>
        <Modal.Body>
          {modalViewPage == GCPModalView.TableView && renderGCPTableView()}
          {modalViewPage == GCPModalView.TaggingView && renderGcpTaggingView()}
          {modalViewPage == GCPModalView.MapView && (
            <ViewGeotagGcpMapPreview
              dataset={iterationDataset}
              showGeotagImageActionButton={false}
              showGCPActionButton={true}
              onClickGeotagImagePoint={() => {}}
              onClickGCPImagePoint={(e) => onClickGcpImagePoint(e)}
            />
          )}
        </Modal.Body>
      </Modal>
      {iterationDataset && showGCPUploadModal && (
        <UploadGCPModal {...{ iterationDataset, hideGcpUploadModal }} />
      )}
    </>
  );
};
