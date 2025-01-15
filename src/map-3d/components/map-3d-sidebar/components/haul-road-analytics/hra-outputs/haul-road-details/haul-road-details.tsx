import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
  Spinner,
} from '@aus-platform/design-system';
import { isUndefined } from 'lodash';
import { useEffect } from 'react';
import { HaulRoadDetailsLayers } from './haul-road-details-layers';
import { selectHRA, setHRATable } from 'map-3d/shared/map-3d-slices';
import { handleResponseErrorMessage, useHaulRoad } from 'shared/api';
import { useAppDispatch, useAppSelector } from 'src/app/hooks';
import { OverflowTextTooltip } from 'src/shared/components/overflow-text-tooltip';

type HaulRoadDetailsProps = {
  haulRoadId: string;
  onClickBackButton: VoidFunction;
};

export const HaulRoadDetails: React.FC<HaulRoadDetailsProps> = ({
  haulRoadId,
  onClickBackButton,
}) => {
  // Selectors.
  const { table } = useAppSelector(selectHRA);

  // Dispatch.
  const dispatch = useAppDispatch();

  // API.
  const {
    data: haulRoadResponseData,
    error: haulRoadErrorResponse,
    isError: isErrorHaulRoad,
    isLoading: isLoadingHaulRoad,
  } = useHaulRoad(haulRoadId);

  // useEffects.
  useEffect(() => {
    handleResponseErrorMessage(isErrorHaulRoad, haulRoadErrorResponse);
  }, [isErrorHaulRoad, haulRoadErrorResponse]);

  // Handlers.
  const onClickViewTableHandler = () => {
    const haulRoadName = haulRoadResponseData?.name;

    dispatch(setHRATable({ ...table, show: true, haulRoadId, haulRoadName }));
  };

  return (
    <>
      {isLoadingHaulRoad ? (
        <Spinner />
      ) : (
        <div className="haul-road-details">
          <div className="haul-road-details-header">
            <Icon
              identifier={IconIdentifier.ArrowLeft}
              colorClass={ColorClass.Neutral300}
              className="haul-road-details-header__back-button"
              cursor
              onClick={onClickBackButton}
            />
            {haulRoadResponseData && (
              <OverflowTextTooltip
                text={haulRoadResponseData.name}
                maxLength={36}
              />
            )}
          </div>
          <div className="haul-road-details-info">
            <div className="haul-road-details-info__title haul-road-details-title">
              <span>Haul Road Details</span>
              <hr />
            </div>
            <div className="haul-road-details-info__columns">
              <div>Haul Road Type</div>
              <div>Vehicle Width</div>
              <div>Chainage Interval</div>
            </div>
            <div className="haul-road-details-info__rows">
              <div>{haulRoadResponseData?.type}</div>
              <div>{haulRoadResponseData?.vehicleWidth}</div>
              <div>{haulRoadResponseData?.chainageInterval}</div>
            </div>
          </div>

          {!isUndefined(haulRoadResponseData) && (
            <HaulRoadDetailsLayers
              haulRoadLayers={haulRoadResponseData?.haulRoadLayers}
            />
          )}

          <Button
            className="haul-road-details-view-table-btn"
            onClick={onClickViewTableHandler}
            variant={ButtonVariant.Outline}
            leftIconIdentifier={IconIdentifier.RowAdd}
            iconSize={18}
          >
            View Table
          </Button>
        </div>
      )}
    </>
  );
};
