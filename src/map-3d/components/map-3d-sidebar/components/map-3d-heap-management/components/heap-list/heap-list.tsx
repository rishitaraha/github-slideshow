import {
  Accordion,
  Button,
  ButtonVariant,
  CheckboxAlignment,
  Icon,
  IconIdentifier,
  Input,
  Pill,
  PillShape,
  PillVariant,
  Spinner,
  toast,
  CheckBox,
  AccordionVariant,
} from '@aus-platform/design-system';
import FileSaver from 'file-saver';
import { has, isEmpty, isUndefined, size } from 'lodash';
import React, { useEffect, useState } from 'react';
import { AccordionEventKey } from 'react-bootstrap/esm/AccordionContext';
import { useAppSelector } from '../../../../../../../app/hooks';
import {
  BaseReference,
  HeapResponseDataTypeObj,
  VolumeReportFormat,
  handleResponseErrorMessage,
  handleResponseMessage,
  useDeleteHeap,
  useDownloadHeap,
  useDownloadVolumeReport,
  useRecalculateHeapVolume,
} from '../../../../../../../shared/api';
import { ConfirmationCard } from '../../../../../../../shared/components/cards';
import { Formatter } from '../../../../../../../shared/helpers';
import {
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dHeap,
} from '../../../../../../shared/map-3d-slices';
import { baseReferenceLabel } from '../../constants';
import { EditHeap } from '../edit-heap';
import { HeapBulkSelectCheckBoxStatus } from './enums';
import {
  HeapDeleteConfirmationType,
  HeapListPropsType,
  ShiftKeyRangeSelectedHeapType,
} from './types';

const deleteHeapInitialState = { show: false, index: -1 };
const shiftKeyRangeSelectedHeapInitialState = {
  startingIndex: -1,
  endingIndex: -1,
  isStartHeapSelected: false,
};

export const HeapList: React.FC<HeapListPropsType> = ({
  heapListResponse,
  isHeapListLoading,
  heapListRefetch,
  selectedHeaps,
  onSelectHeapHandler,
}) => {
  // States.
  const [showDeleteConfirmationCard, setShowDeleteConfirmationCard] =
    useState<HeapDeleteConfirmationType>(deleteHeapInitialState);
  const [showEditHeapModal, setShowEditHeapModal] = useState(false);
  const [heapId, setHeapId] = useState('');
  const [activeKey, setActiveKey] = useState<AccordionEventKey>('');
  const [volumeReportFormat, setVolumeReportFormat] =
    useState<VolumeReportFormat>();
  const [bulkSelectCheckBoxStatus, setBulkSelectCheckBoxStatus] =
    useState<HeapBulkSelectCheckBoxStatus>(
      HeapBulkSelectCheckBoxStatus.Unchecked,
    );
  const [shiftKeyRangeSelectedHeap, setShiftKeyRangeSelectedHeap] =
    useState<ShiftKeyRangeSelectedHeapType>(
      shiftKeyRangeSelectedHeapInitialState,
    );

  // Selectors.
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);
  const { polygonTool } = useAppSelector(selectMap3dHeap);

  // Apis.
  const {
    mutate: sendDownloadVolumeReportRequest,
    data: downloadVolumeReportResponse,
    isSuccess: isDownloadVolumeReportSuccess,
    isPending: isVolumeReportLoading,
    isError: isDownloadVolumeReportHasError,
    error: downloadVolumeReportError,
  } = useDownloadVolumeReport();

  const {
    mutate: sendDeleteHeapRequest,
    isSuccess: isSuccessDeleteHeap,
    isError: isErrorDeleteHeap,
    error: deleteHeapError,
  } = useDeleteHeap();

  const {
    mutate: sendRecalculateHeapVolumeRequest,
    data: recalculateHeapVolumeResponse,
    isSuccess: isSuccessRecalculateHeapVolume,
    isError: isErrorRecalculateHeapVolume,
    error: recalculateHeapVolumeError,
  } = useRecalculateHeapVolume();

  const {
    mutate: sendDownloadHeapRequest,
    data: downloadHeapResponse,
    isSuccess: isSuccessDownloadHeap,
  } = useDownloadHeap();

  // useEffects.
  useEffect(() => {
    if (selectedTerrainIteration?.id) {
      heapListRefetch();
    }
  }, [polygonTool]);

  useEffect(() => {
    if (isSuccessDeleteHeap) {
      heapListRefetch();
      toast.success('Heap deleted successfully');
    }

    handleResponseErrorMessage(isErrorDeleteHeap, deleteHeapError);
  }, [isSuccessDeleteHeap, isErrorDeleteHeap, deleteHeapError]);

  useEffect(() => {
    if (isSuccessRecalculateHeapVolume && recalculateHeapVolumeResponse) {
      const heapResponse: HeapResponseDataTypeObj =
        recalculateHeapVolumeResponse.data;

      // User clicks on recalculate heap without selecting it. (Then the heap needs to be selected.)
      if (!has(selectedHeaps, heapResponse.id)) {
        onSelectHeapHandler?.(heapResponse);
      }

      polygonTool?.importWKT(
        heapResponse.geometry,
        heapResponse.id,
        { heapId: heapResponse.id },
        heapResponse.name,
      );
    }
    handleResponseMessage(
      isSuccessRecalculateHeapVolume,
      isErrorRecalculateHeapVolume,
      recalculateHeapVolumeResponse,
      recalculateHeapVolumeError,
    );
    heapListRefetch();
  }, [
    isSuccessRecalculateHeapVolume,
    isErrorRecalculateHeapVolume,
    recalculateHeapVolumeResponse,
  ]);

  useEffect(() => {
    if (downloadHeapResponse && isSuccessDownloadHeap) {
      const heap = heapListResponse?.data.find((heap) => heap.id === heapId);
      if (!isUndefined(heap)) {
        FileSaver.saveAs(downloadHeapResponse, `${heap.name}.geojson`);
      }
    }
  }, [downloadHeapResponse, isSuccessDownloadHeap]);

  useEffect(() => {
    if (
      downloadVolumeReportResponse &&
      isDownloadVolumeReportSuccess &&
      selectedTerrainIteration
    ) {
      FileSaver.saveAs(
        downloadVolumeReportResponse,
        `${selectedTerrainIteration.name}-volume-report.${volumeReportFormat}`,
      );
    }
    handleResponseErrorMessage(
      isDownloadVolumeReportHasError,
      downloadVolumeReportError,
    );
  }, [isDownloadVolumeReportSuccess, downloadVolumeReportResponse]);

  // useEffect - handle heap's bulk select checkbox status.
  useEffect(() => {
    const selectedHeapsLength = size(selectedHeaps);

    // No heaps are selected - unchecked.
    if (selectedHeapsLength === 0) {
      setBulkSelectCheckBoxStatus(HeapBulkSelectCheckBoxStatus.Unchecked);
    }
    // Some heaps are selected - indeterminate.
    else if (
      selectedHeapsLength > 0 &&
      selectedHeapsLength !== heapListResponse?.data.length
    ) {
      setBulkSelectCheckBoxStatus(HeapBulkSelectCheckBoxStatus.Indeterminate);
    }
    // All heaps are selected - checked.
    else {
      setBulkSelectCheckBoxStatus(HeapBulkSelectCheckBoxStatus.Checked);
    }
  }, [selectedHeaps]);

  // Handlers.
  const onDeleteHeapSubmit = (heap) => {
    // Delete all polygons of the heap.
    polygonTool?.deleteAllPolygons();

    // To handle the case when user selects a heap and deletes it.
    if (has(selectedHeaps, heap.id)) {
      onSelectHeapHandler?.(heap);
    }

    sendDeleteHeapRequest({ id: heap.id });
    setShowDeleteConfirmationCard(deleteHeapInitialState);
  };

  const jumpToHeap = (heap: HeapResponseDataTypeObj) => {
    if (has(selectedHeaps, heap.id)) {
      const centroid = heap.centroid.split(' ');

      cesiumProxy?.flyTo({
        longitude: centroid[0],
        latitude: centroid[1],
        height: 1000,
      });
    }
  };

  const recalculateHeapVolume = (heap: HeapResponseDataTypeObj) => {
    toast.info('Recalculating heap volume.');
    sendRecalculateHeapVolumeRequest({ id: heap.id });
  };

  const onCloseEditHeap = () => {
    setShowEditHeapModal(false);
  };

  const onClickEditHeap = (heapId: string) => {
    setHeapId(heapId);
    setShowEditHeapModal(!showEditHeapModal);
  };

  const onClickDownloadHeap = (heapId: string) => {
    setHeapId(heapId);
    sendDownloadHeapRequest(heapId);
  };

  const onClickDownloadPdf = () => {
    if (selectedHeaps) {
      setVolumeReportFormat(VolumeReportFormat.PDF);
      sendDownloadVolumeReportRequest({
        heapIds: Object.keys(selectedHeaps),
        responseFormat: VolumeReportFormat.PDF,
      });
    }
  };

  const onClickDownloadCsv = () => {
    if (selectedHeaps) {
      setVolumeReportFormat(VolumeReportFormat.CSV);
      sendDownloadVolumeReportRequest({
        heapIds: Object.keys(selectedHeaps),
        responseFormat: VolumeReportFormat.CSV,
      });
    }
  };

  const onClickBulkSelect = () => {
    if (bulkSelectCheckBoxStatus === HeapBulkSelectCheckBoxStatus.Checked) {
      // Remove selected heaps.
      heapListResponse?.data.forEach((heap) => {
        onSelectHeapHandler?.(heap);
      });
      setBulkSelectCheckBoxStatus(HeapBulkSelectCheckBoxStatus.Unchecked);
    } else {
      // Select all unselected heaps.
      heapListResponse?.data.forEach((heap) => {
        if (!has(selectedHeaps, heap.id)) {
          onSelectHeapHandler?.(heap);
        }
      });
      setBulkSelectCheckBoxStatus(HeapBulkSelectCheckBoxStatus.Checked);
    }
  };

  const onClickSingleSelect = (
    event: React.MouseEvent<HTMLInputElement>,
    heap: HeapResponseDataTypeObj,
    heapIndex: number,
  ) => {
    event.stopPropagation();
    const { shiftKey } = event;

    /**
     * Shift + Select selects a range of heaps between start heap and end heap.
     * To select start heap user doesn't have to hold Shift key,
     * but to select end heap user has to press shift key.
     */
    if (
      shiftKey &&
      shiftKeyRangeSelectedHeap.startingIndex !== -1 &&
      shiftKeyRangeSelectedHeap.endingIndex === -1
    ) {
      setShiftKeyRangeSelectedHeap({
        ...shiftKeyRangeSelectedHeap,
        endingIndex: heapIndex,
      });

      const startIndex = Math.min(
        shiftKeyRangeSelectedHeap.startingIndex,
        heapIndex,
      );
      const endIndex = Math.max(
        shiftKeyRangeSelectedHeap.startingIndex,
        heapIndex,
      );

      heapListResponse?.data.forEach((heapItem, index) => {
        if (index >= startIndex && index <= endIndex) {
          // Start heap is selected, select heaps which are not selected till end heap.
          if (
            shiftKeyRangeSelectedHeap.isStartHeapSelected &&
            !has(selectedHeaps, heapItem.id)
          ) {
            onSelectHeapHandler?.(heapItem);
          }

          // Start heap is not selected, unselect heaps till end heap.
          if (
            !shiftKeyRangeSelectedHeap.isStartHeapSelected &&
            has(selectedHeaps, heapItem.id)
          ) {
            onSelectHeapHandler?.(heapItem);
          }
        }
      });
    } else {
      setShiftKeyRangeSelectedHeap({
        ...shiftKeyRangeSelectedHeap,
        startingIndex: heapIndex,
        endingIndex: -1,
        // changing the previous status of start heap after this thus the !
        isStartHeapSelected: !has(selectedHeaps, heap.id),
      });
      onSelectHeapHandler?.(heap);
    }
  };

  // Renders.
  return (
    <div className="heap-list-content-container">
      {isHeapListLoading ? (
        <Spinner />
      ) : size(heapListResponse?.data) === 0 ? (
        <div className="heap-list--empty">No heaps present.</div>
      ) : (
        <>
          <div className="heap-list">
            <div className="heap-list__header">
              <span>Heap Name</span>
              <Input.CheckBox
                onClick={() => {
                  onClickBulkSelect();
                }}
                indeterminate={
                  bulkSelectCheckBoxStatus ===
                  HeapBulkSelectCheckBoxStatus.Indeterminate
                }
                checked={
                  bulkSelectCheckBoxStatus ===
                  HeapBulkSelectCheckBoxStatus.Checked
                }
              />
            </div>
            <Accordion
              // To access the currently opened accordion
              onSelect={(activeIndex) => {
                setActiveKey(activeIndex);
              }}
              variant={AccordionVariant.ChevronLeft}
              className="heap-list-accordion"
            >
              {heapListResponse?.data.map(
                (heap: HeapResponseDataTypeObj, index: number) => {
                  return (
                    <div key={index}>
                      <div className="heap-list-container">
                        <CheckBox
                          alignCheckbox={CheckboxAlignment.Right}
                          title={heap.name}
                          checked={has(selectedHeaps, heap.id)}
                          onClick={(event) => {
                            onClickSingleSelect(event, heap, index);
                          }}
                          onChange={() => {}}
                          className="heap-list__modal-checkbox"
                        />
                        <div className="heap-list__modal-body">
                          <div>
                            <div className="heap-list__modal-sub-header">
                              <div className="heap-list__modal-sub-header__text">
                                Volume (m<sup>3</sup>)
                              </div>
                            </div>
                            <div className="heap-list__modal-text">
                              <div className="heap-list__modal-detail">
                                <span className="heap-list__modal-label">
                                  Cut
                                </span>
                                <span>{heap.cutVolume || '-'}</span>
                              </div>
                              <div className="heap-list__modal-detail">
                                <span className="heap-list__modal-label">
                                  Fill
                                </span>
                                <span>{heap.fillVolume || '-'}</span>
                              </div>
                              <div className="heap-list__modal-detail">
                                <span className="heap-list__modal-label">
                                  Net
                                </span>
                                <span>{heap.netVolume || '-'}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="heap-list__modal-sub-header">
                              <div className="heap-list__modal-sub-header__text">
                                Weight (tonnes)
                              </div>
                            </div>
                            <div className="heap-list__modal-text">
                              <div className="heap-list__modal-detail">
                                <span className="heap-list__modal-label">
                                  Cut
                                </span>
                                <span>{heap.cutWeight || '-'}</span>
                              </div>
                              <div className="heap-list__modal-detail">
                                <span className="heap-list__modal-label">
                                  Fill
                                </span>
                                <span>{heap.fillWeight || '-'}</span>
                              </div>
                              <div className="heap-list__modal-detail">
                                <span className="heap-list__modal-label">
                                  Net
                                </span>
                                <span>{heap.netWeight || '-'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="heap-list__btn-container">
                          <Icon
                            className="heap-list__btn heap-list__btn-delete"
                            identifier={IconIdentifier.Bin}
                            onClick={() =>
                              setShowDeleteConfirmationCard({
                                show: true,
                                index: index,
                              })
                            }
                          />
                          <Icon
                            className="heap-list__btn heap-list__btn-edit"
                            identifier={IconIdentifier.Pencil}
                            onClick={() => onClickEditHeap(heap.id)}
                          />
                          <Icon
                            className="heap-list__btn heap-list__btn-download"
                            onClick={() => onClickDownloadHeap(heap.id)}
                            identifier={IconIdentifier.Download}
                          />
                          <Icon
                            className="heap-list__btn heap-list__btn-redo"
                            identifier={IconIdentifier.Reset}
                            onClick={() => recalculateHeapVolume(heap)}
                          />
                          <Icon
                            className="heap-list__btn heap-list__btn-jumpto"
                            identifier={IconIdentifier.GCPAvailableTagged}
                            onClick={() => jumpToHeap(heap)}
                            isDisabled={!has(selectedHeaps, heap.id)}
                          />
                        </div>
                        <Accordion.Item
                          title={
                            activeKey === `heap-accordion-${index}`
                              ? 'Less Details'
                              : 'More Details'
                          }
                          eventKey={`heap-accordion-${index}`}
                        >
                          <div className="heap-list__modal-body--extended">
                            <div className="heap-list__modal-detail-container">
                              <div className="heap-list__modal-sub-header">
                                <div className="heap-list__modal-sub-header-text">
                                  Base Reference
                                </div>
                              </div>
                              <div className="heap-list__modal-text base-reference">
                                <div className="heap-list__modal-detail">
                                  <span className="heap-list__modal-label">
                                    {baseReferenceLabel[heap.baseReference]}
                                  </span>
                                  {heap.baseReference ===
                                    BaseReference.OtherIterationDsm && (
                                    <span className="other-iteration-name">
                                      {heap.baseIteration}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="heap-list__modal-detail-container">
                              <div className="heap-list__modal-sub-header">
                                <div className="heap-list__modal-sub-header-text">
                                  Heap Category
                                </div>
                              </div>

                              <div className="heap-list__modal-detail ">
                                <div className="category">
                                  {Formatter.toTitleCase(heap.category, '_')}
                                </div>
                              </div>
                            </div>
                            <div className="heap-list__modal-detail-container">
                              <div className="heap-list__modal-sub-header">
                                <div className="heap-list__modal-sub-header-text">
                                  Heap Material
                                </div>
                              </div>

                              <div className="heap-list__modal-detail heap-list__modal-detail--heap-material-detail">
                                <div className="material-type">
                                  {heap.materialType}
                                </div>
                                {heap.includedInKpi && (
                                  <Pill
                                    variant={PillVariant.Info}
                                    shape={PillShape.Rectangle}
                                  >
                                    KPI
                                  </Pill>
                                )}
                              </div>
                            </div>

                            <div className="heap-list__modal-detail-container">
                              <div className="heap-list__modal-sub-header">
                                <div className="heap-list__modal-sub-header-text">
                                  Bulk Density (gm/cm<sup>3</sup>)
                                </div>
                              </div>
                              <div className="heap-list__modal-text base-reference">
                                <div className="heap-list__modal-detail">
                                  {heap.bulkDensity}
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="heap-list__modal-sub-header">
                                <div className="heap-list__modal-sub-header-text">
                                  Description
                                </div>
                              </div>
                              <div className="heap-list__modal-text base-reference">
                                <div className="heap-list__modal-detail">
                                  {heap.remarks}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Accordion.Item>
                      </div>
                      {showDeleteConfirmationCard.show &&
                        showDeleteConfirmationCard.index === index && (
                          <ConfirmationCard
                            title="Delete Confirmation"
                            message={`Are you sure you want to delete ${heap.name} ?`}
                            onSubmit={() => onDeleteHeapSubmit(heap)}
                            onCancel={() =>
                              setShowDeleteConfirmationCard(
                                deleteHeapInitialState,
                              )
                            }
                            submitLabel="Delete"
                            cancelLabel="Cancel"
                          />
                        )}
                    </div>
                  );
                },
              )}
              <EditHeap
                onClose={onCloseEditHeap}
                heapId={heapId}
                refetchHeapList={heapListRefetch}
                show={showEditHeapModal}
              />
            </Accordion>
          </div>
          <div className="heap-list__footer">
            <Button
              onClick={onClickDownloadCsv}
              disabled={isEmpty(selectedHeaps)}
              isLoading={
                isVolumeReportLoading &&
                volumeReportFormat == VolumeReportFormat.CSV
              }
              variant={ButtonVariant.Secondary}
            >
              Download CSV
            </Button>
            <Button
              onClick={onClickDownloadPdf}
              disabled={isEmpty(selectedHeaps)}
              isLoading={
                isVolumeReportLoading &&
                volumeReportFormat == VolumeReportFormat.PDF
              }
            >
              Export PDF
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
