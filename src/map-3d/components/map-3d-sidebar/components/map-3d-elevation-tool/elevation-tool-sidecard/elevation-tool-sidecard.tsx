import { GEOMETRY_TYPE } from '@aus-platform/cesium';
import {
  Button,
  ButtonVariant,
  CheckBox,
  Divider,
  FormMessage,
  FormMessageVariant,
  IconIdentifier,
  Input,
  InputGroup,
  Spinner,
  toast,
} from '@aus-platform/design-system';
import { Point } from 'chart.js';
import { clone, has, isEmpty, isNil, keys, omit } from 'lodash';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { ElevationProfileChartData } from '..';
import { MapTool } from '../../../../map-3d-container/map-3d-tools';
import { Map3DNoTerrainSelected } from '../../../shared';
import { elevationProfileToastErrors } from './constants';
import { AreaOfInterest, ElevationFormMessage } from './enums';
import {
  ElevationProfileFormMessageType,
  ElevationToolSidecardProps,
  IterationListType,
  SelectedIterationType,
} from './types';
import {
  selectActiveWorkspaceLayersByFeatureType,
  selectElevationTool,
  selectMap3DState,
  selectMap3dDataset,
  setCurrentActiveMapTool,
  setElevationLineTool,
  setIsElevationProfileSelectLayersActive,
} from 'map-3d/shared/map-3d-slices';
import {
  FeatureInfoTool,
  LineEventType,
  LineTool,
} from 'map-3d/shared/map-3d-tools';
import { ToolEvent } from 'map-3d/shared/map-3d-tools/enums';
import {
  ElevationProfile,
  FeatureGeometryType,
  IterationListItem,
  handleResponseMessage,
  useFeatureInfo,
  useGenerateElevationProfile,
  useIterationsList,
} from 'shared/api';
import { ErrorSlugs } from 'shared/enums';
import { useOnFirstMount } from 'shared/hooks';
import { IFeatureInfoTool } from 'map-3d/shared/map-3d-tools/interfaces';
import { useAppDispatch, useAppSelector } from 'app/hooks';

export const ElevationToolSideCard: React.FC<ElevationToolSidecardProps> = ({
  elevationProfile,
  setElevationProfile,
  setIterationIds,
  setLineCoordinates,
}) => {
  // Selectors.
  const { lineTool } = useAppSelector(selectElevationTool);
  const { currentActiveMapTool } = useAppSelector(selectMap3DState);
  const workspaceLineLayersCount = useAppSelector((state) =>
    selectActiveWorkspaceLayersByFeatureType(state, FeatureGeometryType.Line),
  ).length;

  // States.
  const [iterationList, setIterationList] = useState<IterationListType[]>([]);
  const [selectedIterations, setSelectedIterations] =
    useState<SelectedIterationType | null>(null);
  const [currentAreaOfInterest, setCurrentAreaOfInterest] =
    useState<AreaOfInterest>(AreaOfInterest.Draw);
  const [featureInfoTool, setFeatureInfoTool] = useState<IFeatureInfoTool>();
  const [formMessage, setFormMessage] =
    useState<ElevationProfileFormMessageType>(null);
  const [selectedLineFeature, setSelectedLineFeature] = useState<
    string | null
  >();
  const [isElevationProfileDisabled, setIsElevationProfileDisabled] = useState(
    (currentAreaOfInterest === AreaOfInterest.Draw &&
      !lineTool?.isAnyLineDrawn) ||
      (currentAreaOfInterest === AreaOfInterest.WorkspaceLineFeatures &&
        formMessage?.variant === FormMessageVariant.Error),
  );

  // Hooks.
  const { selectedTerrainIteration, selectedTerrainSite } =
    useAppSelector(selectMap3dDataset);
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const isFirstRender = useOnFirstMount();
  const dispatch = useAppDispatch();

  // Variables.
  const { showElevationProfileModal } = elevationProfile;

  // Api.
  const {
    data: iterationListResponse,
    isLoading: isLoadingIterationList,
    isSuccess: isSuccessIterationList,
    refetch: refetchIterationList,
  } = useIterationsList({ siteId: selectedTerrainSite?.id ?? '' }, false);

  const {
    mutate: sendGenerateElevationProfileRequest,
    isPending: isLoadingGenerateElevationProfile,
    data: generateElevationProfileResponse,
    isSuccess: isSuccessGenerateElevationProfile,
    isError: isErrorGenerateElevationProfile,
    error: generateElevationProfileError,
  } = useGenerateElevationProfile();

  const {
    data: featureInfoResponse,
    error: featureInfoErrorResponse,
    isSuccess: isSuccessFeatureInfo,
    isError: isErrorSuccessFeatureInfo,
  } = useFeatureInfo(selectedLineFeature ?? '', !!selectedLineFeature);

  // useEffects.
  useEffect(() => {
    if (cesiumProxy) {
      const lineTool = new LineTool(cesiumProxy?.cesiumViewer);
      dispatch(setElevationLineTool(lineTool));

      lineTool.addEventListener(LineEventType.LineCreated, () => {
        setIsElevationProfileDisabled(false);
      });
    }

    return () => {
      lineTool?.deleteAllLines();
      lineTool?.deactivate();
      dispatch(dispatch(setIsElevationProfileSelectLayersActive(false)));
    };
  }, []);

  // Clear out previously calculated elevation profile on changing terrain.
  useEffect(() => {
    if (selectedTerrainIteration && selectedTerrainIteration.id) {
      refetchIterationList();

      setSelectedIterations({
        [selectedTerrainIteration.id]: {
          name: selectedTerrainIteration.name,
        },
      });

      resetElevationProfile();
      lineTool?.deleteAllLines();
      lineTool?.deactivate();
    }
  }, [selectedTerrainIteration]);

  useEffect(() => {
    if (isSuccessIterationList && iterationListResponse) {
      setIterationList(
        // Here we need all the iterations except the
        // one that we've already selected in dataset
        iterationListResponse.list.filter(
          (iteration: IterationListItem) =>
            selectedTerrainIteration?.id !== iteration.id,
        ),
      );
    }
  }, [isSuccessIterationList, iterationListResponse]);

  useEffect(() => {
    if (isFirstRender) {
      return;
    }

    let updatedElevationProfile = clone(elevationProfile);
    if (isSuccessGenerateElevationProfile && generateElevationProfileResponse) {
      const { elevationProfiles, distancePoints } =
        generateElevationProfileResponse.data;

      const iterations: string[] = [];
      const elevationsList: Point[][] = [];

      elevationProfiles.forEach((elevationProfile: ElevationProfile) => {
        const { iteration, elevations } = elevationProfile;
        const coordinates: Point[] = [];
        elevations.forEach((elevation) => {
          coordinates.push({ x: elevation[0], y: elevation[1] });
        });

        elevationsList.push(coordinates);
        if (!isNil(selectedIterations)) {
          iterations.push(selectedIterations[iteration].name);
        }
      });

      const elevationChartData: ElevationProfileChartData = {
        distancePoints,
        elevationsList,
        iterations,
      };

      updatedElevationProfile = {
        ...updatedElevationProfile,
        elevationProfileChartData: elevationChartData,
        elevationProfileError: null,
        isElevationProfileModalEmpty: false,
        isElevationProfileModalLoading: false,
      };
    } else if (isErrorGenerateElevationProfile) {
      // Adding error message to elevation profile.
      const errorSlug = generateElevationProfileError?.meta.slug;

      updatedElevationProfile = {
        ...updatedElevationProfile,
        isElevationProfileModalEmpty: true,
        elevationProfileError:
          errorSlug === ErrorSlugs.LineOutOfBounds
            ? elevationProfileToastErrors[errorSlug]
            : null,
      };
    } else if (isLoadingGenerateElevationProfile) {
      updatedElevationProfile.isElevationProfileModalLoading = true;
      toast.info('Calculating elevation.');
    }

    setElevationProfile(updatedElevationProfile);

    handleResponseMessage(
      isSuccessGenerateElevationProfile,
      isErrorGenerateElevationProfile,
      generateElevationProfileResponse,
      generateElevationProfileError,
    );
  }, [
    isSuccessGenerateElevationProfile,
    generateElevationProfileResponse,
    isErrorGenerateElevationProfile,
    isLoadingGenerateElevationProfile,
  ]);

  useEffect(() => {
    if (isSuccessFeatureInfo && featureInfoResponse && lineTool) {
      const activeLineStyleOptions = {
        lineStyleOptions: {
          strokeColor: '#3f95fd',
        },
      };

      lineTool.importWKT(
        featureInfoResponse.data.geometry,
        featureInfoResponse.data.id,
        {},
        undefined,
        activeLineStyleOptions,
      );
    }
    handleResponseMessage(
      isSuccessFeatureInfo,
      isErrorSuccessFeatureInfo,
      featureInfoResponse,
      featureInfoErrorResponse,
    );
  }, [
    isSuccessFeatureInfo,
    featureInfoResponse,
    isErrorSuccessFeatureInfo,
    featureInfoErrorResponse,
  ]);

  useEffect(() => {
    if (!cesiumProxy?.viewer) {
      return;
    }

    const featureInfoTool = new FeatureInfoTool(cesiumProxy.cesiumViewer);
    setFeatureInfoTool(featureInfoTool);

    // Event Listeners declared inside useEffect to remove them properly.
    const onFeatureFocusListener = ([featureId], type) => {
      if (currentAreaOfInterest !== AreaOfInterest.WorkspaceLineFeatures) {
        return;
      }

      lineTool?.deleteAllLines();

      // Clear out previous form messages.
      setFormMessage(null);

      if (type !== GEOMETRY_TYPE.LINE) {
        setFormMessage({
          variant: FormMessageVariant.Error,
          message: ElevationFormMessage.NotLineFeature,
        });
      } else {
        setSelectedLineFeature(featureId);
      }
    };

    const onFeatureBlurListener = () => {
      setFormMessage(null);
    };

    featureInfoTool.addEventListener(ToolEvent.Blur, onFeatureBlurListener);
    featureInfoTool.addEventListener(ToolEvent.Focus, onFeatureFocusListener);

    return () => {
      featureInfoTool.removeEventListener(
        ToolEvent.Blur,
        onFeatureBlurListener,
      );
      featureInfoTool.removeEventListener(
        ToolEvent.Focus,
        onFeatureFocusListener,
      );
    };
  }, [cesiumProxy?.viewer, currentAreaOfInterest]);

  useEffect(() => {
    if (
      !isNil(selectedLineFeature) &&
      currentAreaOfInterest === AreaOfInterest.WorkspaceLineFeatures
    ) {
      drawElevationGraph();
    }

    setIsElevationProfileDisabled(isNil(selectedLineFeature));
  }, [selectedLineFeature]);

  // Handlers.
  const onSelectIterationHandler = (selectedIteration: IterationListType) => {
    // Checking if the key exists in the object or not.
    if (!has(selectedIterations, selectedIteration.id)) {
      setSelectedIterations((prev) => ({
        ...prev,
        [selectedIteration.id]: {
          name: selectedIteration.name,
        },
      }));
    } else {
      // Remove the object which has selectLayer.id as key.
      const remainingIterations = omit(selectedIterations, [
        selectedIteration.id,
      ]);
      if (isEmpty(remainingIterations)) {
        setSelectedIterations(null);
      } else {
        setSelectedIterations(remainingIterations);
      }
    }
  };

  const resetElevationProfile = () => {
    if (lineTool?.isAnyLineDrawn) {
      lineTool?.deleteAllLines();
      setElevationProfile({
        ...elevationProfile,
        isElevationProfileModalEmpty: true,
        elevationProfileError: null,
        elevationProfileChartData: null,
      });
    }
  };

  const drawHandler = () => {
    resetElevationProfile();
    dispatch(setCurrentActiveMapTool(MapTool.None));

    lineTool?.activate(
      {
        elevationProfileLine: true,
      },
      {},
      true,
    );

    // ELevation profile should be disabled if no line is drawn.
    setIsElevationProfileDisabled(true);
    lineTool?.enableSingleLineDrawing();
  };

  const drawElevationGraph = () => {
    if (!selectedIterations || !lineTool) {
      return;
    }

    if (
      !lineTool?.isAnyLineDrawn &&
      currentAreaOfInterest === AreaOfInterest.Draw
    ) {
      toast.error('Please draw a line first.');
      return;
    }

    const selectedIterationsIds = keys(selectedIterations);

    if (!isNil(selectedLineFeature)) {
      sendGenerateElevationProfileRequest({
        iterations: selectedIterationsIds,
        feature: selectedLineFeature,
      });
    } else {
      const lineWkt = lineTool.exportCurrentLinesToWKT()[0].wkt ?? '';
      const positions = lineTool
        .getLinesByProperty('elevationProfileLine', true)
        .map(lineTool.getCartographicPositions)[0];

      setLineCoordinates({
        wkt: lineWkt,
        coordinateArray: positions
          ? [positions[0], positions[positions.length - 1]]
          : [],
      });

      sendGenerateElevationProfileRequest({
        iterations: selectedIterationsIds,
        lineWkt,
      });
    }

    setIterationIds(selectedIterationsIds);

    setElevationProfile({
      ...elevationProfile,
      showElevationProfileModal: true,
      isElevationProfileModalEmpty: false,
      isElevationProfileModalLoading: true,
    });
  };

  const onToggleChange = () => {
    if (
      currentActiveMapTool === MapTool.FeatureTool &&
      currentAreaOfInterest === AreaOfInterest.Draw
    ) {
      return;
    }

    // Reset previously calculated elevation profile.
    resetElevationProfile();
    setCurrentAreaOfInterest((prevState) => {
      // Select feature.
      if (prevState === AreaOfInterest.Draw) {
        dispatch(setIsElevationProfileSelectLayersActive(true));
        featureInfoTool?.activate();

        setFormMessage({
          message: ElevationFormMessage.SelectFeature,
          variant: FormMessageVariant.Info,
        });

        if (workspaceLineLayersCount === 0) {
          setFormMessage({
            message: ElevationFormMessage.NoLineErrors,
            variant: FormMessageVariant.Error,
          });
        }
      }
      // Draw elevation line mode.
      else {
        lineTool?.deleteAllLoadedLines();
        dispatch(setIsElevationProfileSelectLayersActive(false));
        featureInfoTool?.deactivate();
        setFormMessage(null);
        setSelectedLineFeature(null);
      }

      return prevState === AreaOfInterest.Draw
        ? AreaOfInterest.WorkspaceLineFeatures
        : AreaOfInterest.Draw;
    });
  };

  // TODO: Remove after fixing ToggleSwitch.
  // Constants.
  const leftBoxClassName = classNames([
    'toggle-switch__box',
    {
      active: currentAreaOfInterest === AreaOfInterest.Draw,
      disabled: !(currentAreaOfInterest === AreaOfInterest.Draw),
    },
  ]);

  const rightBoxClassName = classNames([
    'toggle-switch__box',
    {
      active: !(currentAreaOfInterest === AreaOfInterest.Draw),
      disabled: currentAreaOfInterest === AreaOfInterest.Draw,
      'cursor-not-allowed':
        currentActiveMapTool === MapTool.FeatureTool &&
        currentAreaOfInterest === AreaOfInterest.Draw,
    },
  ]);

  // Render.
  return (
    <div className="map-3d-elevation-container">
      {selectedTerrainIteration?.id ? (
        <>
          <div className="map-3d-elevation-content">
            <InputGroup>
              <Input.Label className="map-3d-elevation__section-header">
                Active Dataset
              </Input.Label>
              <Input.Label>Site</Input.Label>
              <Input.Text value={selectedTerrainSite?.name} readOnly disabled />
              <Input.Label>Iteration</Input.Label>
              <Input.Text
                value={selectedTerrainIteration?.name}
                readOnly
                disabled
              />
            </InputGroup>
            <div className="map-3d-elevation__compare-iteration__container">
              <Input.Label className="map-3d-elevation__section-header">
                Select Iteration(s) to compare
              </Input.Label>
              <div className="map-3d-elevation__compare-iteration">
                {isLoadingIterationList ? (
                  <Spinner />
                ) : iterationList.length === 0 ? (
                  <div className="map-3d-elevation__compare-iteration__empty-list">
                    No iterations to compare.
                  </div>
                ) : (
                  iterationList.map((iteration, index: number) => {
                    return (
                      <CheckBox
                        key={index}
                        title={iteration.name}
                        onClick={() => onSelectIterationHandler(iteration)}
                        checked={!isNil(selectedIterations?.[iteration.id])}
                        showCard={true}
                      />
                    );
                  })
                )}
              </div>
            </div>
            <InputGroup className="map-3d-elevation__mark-area">
              <Input.Label className="map-3d-elevation__section-header">
                Mark Area of Interest
              </Input.Label>

              {/* TODO: Fix ToggleSwitch component */}
              <div className="map-3d-elevation__toggle-switch toggle-switch">
                <div className={leftBoxClassName} onClick={onToggleChange}>
                  {'Draw'}
                </div>
                <div className={rightBoxClassName} onClick={onToggleChange}>
                  {'Select Line Feature'}
                </div>
              </div>
            </InputGroup>
            {currentAreaOfInterest === AreaOfInterest.Draw && (
              <Button
                className="map-3d-elevation__mark-area__draw-line-btn"
                variant={ButtonVariant.Outline}
                leftIconIdentifier={IconIdentifier.Line}
                onClick={drawHandler}
              >
                Start Drawing
              </Button>
            )}
            {formMessage && (
              <FormMessage
                message={formMessage.message}
                variant={formMessage.variant}
              />
            )}
          </div>
          <Divider text="" />
          <div className="map-3d-elevation__footer">
            <Button
              variant={ButtonVariant.Secondary}
              onClick={() =>
                setElevationProfile({
                  ...elevationProfile,
                  showElevationProfileModal: true,
                })
              }
              disabled={showElevationProfileModal}
            >
              Open Graph Viewer
            </Button>
            <Button
              onClick={drawElevationGraph}
              isLoading={isLoadingGenerateElevationProfile}
              disabled={
                isElevationProfileDisabled || isLoadingGenerateElevationProfile
              }
            >
              Generate Profile
            </Button>
          </div>
        </>
      ) : (
        <Map3DNoTerrainSelected />
      )}
    </div>
  );
};
