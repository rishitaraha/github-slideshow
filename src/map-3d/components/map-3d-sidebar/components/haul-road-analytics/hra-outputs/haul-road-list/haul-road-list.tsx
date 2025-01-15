import { Spinner } from '@aus-platform/design-system';
import { useEffect, useState } from 'react';
import { isEmpty } from 'lodash';
import { haulRoadAnalyticsTabs } from '../../enums';
import { HaulRoad } from './haul-road';
import {
  handleResponseErrorMessage,
  HaulRoadListItem,
  useDeleteHaulRoads,
  useHaulRoads,
} from 'shared/api';
import { SelectedTerrainIteration } from 'map-3d/shared/map-3d-slices';
import { ConfirmationModal } from 'src/shared/components';

type HaulRoadListProps = {
  onClickHaulRoad: (haulRoad: HaulRoadListItem) => void;
  iteration: SelectedTerrainIteration;
  activeTabKey: string;
};

export const HaulRoadList: React.FC<HaulRoadListProps> = ({
  onClickHaulRoad,
  iteration,
  activeTabKey,
}) => {
  // States.
  const [isShowDeleteConfirmationModal, setShowDeleteConfirmationModal] =
    useState<boolean>(false);

  const [currentHaulRoadId, setCurrentHaulRoadId] = useState<string>('');

  // APIs.
  const {
    data: haulRoadsResponseData,
    error: haulRoadsErrorResponse,
    isError: isErrorHaulRoads,
    isLoading: isLoadingHaulRoads,
    refetch: refetchHaulRoads,
  } = useHaulRoads({
    iteration: iteration.id,
  });

  const {
    mutate: sendDeleteHaulRoadRequest,
    error: deleteHaulRoadErrorResponse,
    isError: isErrorDeleteHaulRoad,
    isSuccess: isSuccessDeleteHaulRoad,
  } = useDeleteHaulRoads();

  // useEffects.
  useEffect(() => {
    handleResponseErrorMessage(isErrorHaulRoads, haulRoadsErrorResponse);
  }, [isErrorHaulRoads, haulRoadsErrorResponse]);

  useEffect(() => {
    if (activeTabKey === haulRoadAnalyticsTabs.Outputs) {
      refetchHaulRoads();
    }
  }, [activeTabKey]);

  useEffect(() => {
    handleResponseErrorMessage(
      isErrorDeleteHaulRoad,
      deleteHaulRoadErrorResponse,
    );
  }, [isErrorDeleteHaulRoad, deleteHaulRoadErrorResponse]);

  useEffect(() => {
    if (isSuccessDeleteHaulRoad) {
      hideDeleteConfirmationModal();
      refetchHaulRoads();
    }
  }, [isSuccessDeleteHaulRoad]);

  // Handlers.
  const hideDeleteConfirmationModal = () =>
    setShowDeleteConfirmationModal(false);

  const showDeleteConfirmationModal = () =>
    setShowDeleteConfirmationModal(true);

  const onClickDeleteHaulRoad = (id) => {
    showDeleteConfirmationModal();
    setCurrentHaulRoadId(id);
  };

  const onClickDeleteHaulRoadSubmit = () => {
    sendDeleteHaulRoadRequest(currentHaulRoadId);
  };

  return (
    <div className="haul-road-list">
      {isLoadingHaulRoads ? (
        <Spinner />
      ) : isEmpty(haulRoadsResponseData) ? (
        <div className="haul-road-list__empty">
          <div className="haul-road-list__empty__text">
            No entities are present
          </div>
        </div>
      ) : (
        haulRoadsResponseData?.map((haulRoad) => (
          <HaulRoad
            key={'haul-road' + haulRoad.id}
            haulRoad={haulRoad}
            onClick={onClickHaulRoad}
            onClickDeleteHaulRoad={onClickDeleteHaulRoad}
          />
        ))
      )}
      {isShowDeleteConfirmationModal && (
        <ConfirmationModal
          title="Delete Confirmation"
          message={
            <div>
              Are you sure you want to delete? This action will permanently
              remove the selected Haul Road
            </div>
          }
          onSubmit={onClickDeleteHaulRoadSubmit}
          onClose={hideDeleteConfirmationModal}
          confirmText="Delete"
          isConfirmDanger
        />
      )}
    </div>
  );
};
