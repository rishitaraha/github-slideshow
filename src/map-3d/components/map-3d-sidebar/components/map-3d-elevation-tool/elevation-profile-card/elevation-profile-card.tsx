import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
  Pill,
  Spinner,
  Tooltip,
} from '@aus-platform/design-system';
import { Chart, InteractionItem } from 'chart.js';
import classNames from 'classnames';
import { isNil } from 'lodash';
import React, { MouseEvent, useEffect, useRef, useState } from 'react';
import { Card } from 'react-bootstrap';
import { getElementAtEvent } from 'react-chartjs-2';
import { useReactToPrint } from 'react-to-print';
import { PrintWrapper } from '../../../../map-3d-container/print-wrapper';
import { ElevationLineChart } from '../elevation-line-chart';
import { DownloadPopover } from './components';
import { slopeInfoInitialState } from './constants';
import {
  CartesianPoint,
  ElevationProfileCardProps,
  SlopeInfo,
  calculateSlope,
  getPointText,
  getSlopeDetailsText,
} from '.';
import { CustomDate } from 'src/shared/utils';
import { useAppDispatch } from 'src/app/hooks';
import { resetElevationTool } from 'map-3d/shared/map-3d-slices';

export const ElevationProfileCard: React.FC<ElevationProfileCardProps> = ({
  elevationProfile,
  onClose,
  iterationIds,
  lineCoordinates,
}) => {
  // States.
  const [isSlopeCalculationEnabled, setIsSlopeCalculationEnabled] =
    useState(false);
  const [slopeInfo, setSlopeInfo] = useState<SlopeInfo>(slopeInfoInitialState);

  // Constants.
  const {
    showElevationProfileModal: show,
    isElevationProfileModalLoading: isLoading,
    isElevationProfileModalEmpty: isModalEmpty,
    elevationProfileChartData: chartData,
    expandElevationProfileModal: expand,
    elevationProfileError: error,
  } = elevationProfile;

  const elevationClass = classNames([
    'elevation-profile-card',
    expand && 'elevation-profile-card__expand',
    !show && 'elevation-profile-card__hide',
  ]);

  const currentTime = new CustomDate(Date.now()).formatDateTime();
  const reportTitle = 'elevation_profile_report_' + currentTime;

  // useRef.
  const elevationChartRef = useRef<Chart<'line'>>(null);
  const printElementRef = useRef(null);

  //Hooks.
  const handlePrint = useReactToPrint({
    documentTitle: reportTitle,
    content: () => printElementRef.current,
  });

  const dispatch = useAppDispatch();

  // useEffects.
  useEffect(() => {
    return () => {
      dispatch(resetElevationTool());
    };
  }, []);

  useEffect(() => {
    resetSlopePoints();
  }, [iterationIds]);

  // Handlers.
  const resetSlopePoints = () => {
    setSlopeInfo({
      pointA: {
        point: null,
        lineIndex: null,
      },
      pointB: {
        point: null,
        lineIndex: null,
      },
      slopeDetails: null,
    });
  };

  const onClickExitSlopeBtn = () => {
    if (isNil(chartData)) {
      return;
    }

    resetSlopePoints();
    // Toggle slope card option visibility.
    setIsSlopeCalculationEnabled(!isSlopeCalculationEnabled);
  };

  const assignCartesianCoordinates = (
    point: CartesianPoint,
    selectedPointLineIndex: number,
  ) => {
    if (isSlopeCalculationEnabled) {
      /*
        If the slope is already calculated (pointA and pointB both have values) :
        update pointA and remove pointB.
        If a point is clicked (pointA and pointB are not set) then set pointA
        otherwise if (pointA is set) then set pointB.
    */
      const pointA = slopeInfo.pointA.point;
      const pointB = slopeInfo.pointB.point;

      if (pointA && pointB) {
        setSlopeInfo({
          pointA: {
            point: point,
            lineIndex: selectedPointLineIndex,
          },
          pointB: {
            point: null,
            lineIndex: null,
          },
          slopeDetails: null,
        });
      } else if (isNil(pointA)) {
        setSlopeInfo((prev) => ({
          ...prev,
          pointA: {
            point: point,
            lineIndex: selectedPointLineIndex,
          },
        }));
      } else {
        const slopeDetails = calculateSlope(pointA, point);
        setSlopeInfo((prev) => ({
          ...prev,
          pointB: {
            point: point,
            lineIndex: selectedPointLineIndex,
          },
          slopeDetails,
        }));
      }
    }
  };

  const onClickPointHandler = (event: MouseEvent<HTMLCanvasElement>) => {
    const { current: chart } = elevationChartRef;
    if (!chart) {
      return;
    }

    const element: InteractionItem[] = getElementAtEvent(chart, event);
    if (!element.length) {
      return;
    }

    // datasetIndex : index of elevation list in elevation list array | index: elevation index in elevation list.
    const { datasetIndex, index } = element[0];

    if (chartData) {
      const { x, y } = { ...chartData.elevationsList[datasetIndex][index] };
      assignCartesianCoordinates({ distance: x, elevation: y }, datasetIndex);
    }
  };

  const onCloseElevationCardHandler = () => {
    onClose();
    isSlopeCalculationEnabled && setIsSlopeCalculationEnabled(false);
  };

  // Renders.
  const renderSlopeCalculationContainer = () => {
    const pointA = slopeInfo.pointA.point;
    const pointB = slopeInfo.pointB.point;
    const slopeDetailsText = getSlopeDetailsText(slopeInfo.slopeDetails);

    return (
      <div className="elevation-profile-card__header__calculate-slope__container">
        <Pill>
          Point A: {getPointText(pointA)} | Point B: {getPointText(pointB)}
        </Pill>

        <Pill className="elevation-profile-card__header__calculate-slope__slope-detail-pill">
          ∆x: {slopeDetailsText.deltaX}
        </Pill>
        <Pill className="elevation-profile-card__header__calculate-slope__slope-detail-pill">
          ∆y: {slopeDetailsText.deltaY}
        </Pill>

        <Pill className="elevation-profile-card__header__calculate-slope__slope-detail-pill">
          Slope: {slopeDetailsText.slope}
        </Pill>

        <Button
          className="elevation-profile-card__header__calculate-slope__exit-btn"
          variant={ButtonVariant.Link}
          rightIconIdentifier={IconIdentifier.Slope}
          onClick={onClickExitSlopeBtn}
          color={ColorClass.AccentError}
        >
          Exit
        </Button>
      </div>
    );
  };

  const renderCardHeader = () => {
    return (
      <Card.Header>
        <span className="elevation-profile-card__header__text">
          Graph Viewer{' '}
        </span>
        <div className="elevation-profile-card__header">
          <div className="elevation-profile-card__header-options">
            {lineCoordinates?.coordinateArray && (
              <div className="elevation-profile-card__header__line-endpoints">
                <div className="line-endpoints line-endpoints--start">
                  <Icon
                    identifier={IconIdentifier.ChevronSmallLeft}
                    size={14}
                  />
                  <span>
                    From Pos: {lineCoordinates.coordinateArray[0].join(', ')}
                  </span>
                </div>
                <div className="line-endpoints line-endpoints--end">
                  <span>
                    To Pos: {lineCoordinates.coordinateArray[1].join(', ')}
                  </span>
                  <Icon
                    identifier={IconIdentifier.ChevronSmallRight}
                    size={14}
                  />
                </div>
              </div>
            )}
            <div className="elevation-profile-card__header__calculate-slope">
              {isSlopeCalculationEnabled ? (
                renderSlopeCalculationContainer()
              ) : (
                <Tooltip
                  className="elevation-profile-card__header__calculate-slope__tooltip"
                  hoverText="Calculate Slope"
                >
                  <Icon
                    identifier={IconIdentifier.Slope}
                    onClick={onClickExitSlopeBtn}
                    colorClass={ColorClass.Primary500}
                    size={16}
                    isDisabled={isNil(chartData)}
                  />
                </Tooltip>
              )}
            </div>
            <DownloadPopover
              chartData={chartData}
              handlePrint={handlePrint}
              iterationIds={iterationIds}
              elevationChartRef={elevationChartRef}
              lineCoordinates={lineCoordinates}
            />
          </div>
          <Icon
            identifier={IconIdentifier.CrossSmall}
            onClick={onCloseElevationCardHandler}
            colorClass={ColorClass.Neutral300}
            className="elevation-profile-card__header__close-icon"
          />
        </div>
      </Card.Header>
    );
  };

  return (
    <PrintWrapper
      reportTitle={'Elevation Profile Report'}
      ref={printElementRef}
    >
      <Card className={elevationClass}>
        {renderCardHeader()}
        <Card.Body>
          {isModalEmpty ? (
            <div className="elevation-profile-card__no-data">
              <Icon identifier={IconIdentifier.GraphOff} size={70} />
              <div className="elevation-profile-card__no-data__text">
                <span className="elevation-profile-card__no-data__text__head">
                  {error ? error.label : "You've not generated any graphs yet"}
                </span>
                <span className="elevation-profile-card__no-data__text__sub-head">
                  {error ? error.message : 'Please generate one to see it here'}
                </span>
              </div>
            </div>
          ) : isLoading ? (
            <Spinner />
          ) : (
            !isNil(chartData) && (
              <ElevationLineChart
                xAxisData={chartData.distancePoints}
                coordinatesData={chartData.elevationsList}
                xAxisLabel={'Distance (m)'}
                yAxisLabel={'Elevation (m)'}
                datasetLabels={chartData.iterations}
                onClick={(event) => onClickPointHandler(event)}
                ref={elevationChartRef}
                slopePoints={{
                  pointA: slopeInfo.pointA,
                  pointB: slopeInfo.pointB,
                }}
              />
            )
          )}
        </Card.Body>
      </Card>
    </PrintWrapper>
  );
};
