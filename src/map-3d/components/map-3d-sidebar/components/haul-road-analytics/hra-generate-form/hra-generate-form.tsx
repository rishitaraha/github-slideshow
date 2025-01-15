import {
  Accordion,
  AccordionVariant,
  Button,
  ButtonVariant,
  ColorClass,
  FormMessage,
  Icon,
  IconIdentifier,
  Input,
  InputGroup,
  Placement,
  RadioToggleGroup,
  SelectOption,
  ToggleSwitch,
  Tooltip,
} from '@aus-platform/design-system';
import { isNil, xor } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { WorkspaceLayer, WorkspaceLayerListObj } from '../../../shared';
import { setVectorLayerVisibility } from '../../map-3d-workspace';
import { haulRoadAnalyticsTabs } from '../enums';
import { haulRoadLayersType, hraInitialState } from './constant';
import { FormErrorMessages, HaulRoadLayerType, HRALineOptions } from './enums';
import { hraValidator } from './hra-validator';
import { HRAViewOutputs } from './hra-view-outputs';
import { HRAInputFieldType } from './types';
import { useInputFields } from 'shared/hooks';
import { preventNonInteger, preventNonNumber } from 'shared/helpers';
import {
  AddHaulRoadPayload,
  FeatureGeometryType,
  FeatureResponseData,
  FeatureType,
  handleResponseErrorMessage,
  handleResponseSuccessMessage,
  useAddHaulRoad,
  useFeatureList,
  useHaulRoadTypes,
} from 'shared/api';
import {
  selectActiveWorkspaceLayersByFeatureType,
  selectMap3dDataset,
  selectMap3DState,
  selectMap3dWorkspace,
  setCurrentActiveMapTool,
} from 'map-3d/shared/map-3d-slices';
import { ILineTool, IPolygonTool, LineTool, PolygonTool } from 'map-3d/shared';
import { MapTool } from 'map-3d/components/map-3d-container/map-3d-tools';
import { useAppSelector } from 'app/hooks';

export const HRAGenerateForm = ({ setActiveTabKey }) => {
  // States.
  const [currentMarkedArea, setCurrentMarkedArea] = useState(
    HRALineOptions.Draw,
  );
  const [isDrawLineToolEnabled, setIsDrawLineToolEnabled] = useState(false);
  const [currentHRLayerType, setCurrentHRLayerType] = useState(
    HaulRoadLayerType.CenterLineLayer,
  );
  const [haulRoadTypeOptions, setHaulRoadTypeOptions] = useState<
    SelectOption[]
  >([]);
  const [showGenerateHaulRoadForm, setShowGenerateForm] = useState(true);

  // Hooks.
  const {
    values,
    setValues,
    names,
    errors,
    onChange,
    onBlur,
    onFocus,
    setErrors,
    inputHasError,
    optional,
    setOptional,
    getOptionalFields,
  } = useInputFields<HRAInputFieldType>(hraInitialState, hraValidator);

  // Selectors.
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const dispatch = useDispatch();
  const { workspaceLayers } = useAppSelector(selectMap3dWorkspace);
  const activeLineLayers = useAppSelector((state) =>
    selectActiveWorkspaceLayersByFeatureType(state, FeatureGeometryType.Line),
  );
  const activePolygonLayers = useAppSelector((state) =>
    selectActiveWorkspaceLayersByFeatureType(
      state,
      FeatureGeometryType.Polygon,
    ),
  );
  const polygonLayersSelectOption: SelectOption<WorkspaceLayer>[] =
    activePolygonLayers.map((activeLayer) => ({
      label: activeLayer.name,
      value: activeLayer,
    }));

  const singleLineLayersSelectOptions: SelectOption<WorkspaceLayer>[] =
    activeLineLayers
      .filter((activeLayer) => activeLayer.featuresCount?.lines === 1)
      .map((activeLayer) => ({
        label: activeLayer.name,
        value: activeLayer,
      }));

  const twoLineLayersSelectOptions: SelectOption<WorkspaceLayer>[] =
    activeLineLayers
      .filter((activeLayer) => activeLayer.featuresCount?.lines === 2)
      .map((activeLayer) => ({
        label: activeLayer.name,
        value: activeLayer,
      }));

  // UseRefs.
  const lineTool = useRef<ILineTool>();
  const polygonTool = useRef<IPolygonTool>();

  // Constants.
  const isGenerateHRADisabled =
    inputHasError(getOptionalFields()) ||
    (currentMarkedArea === HRALineOptions.Draw &&
      !lineTool.current?.isAnyLineDrawn);

  // UseMemo.
  const visibleWorkspaceLayers: WorkspaceLayerListObj = useMemo(
    () =>
      Object.keys(workspaceLayers).reduce((visibleLayers, layerId) => {
        if (workspaceLayers[layerId].show) {
          visibleLayers[layerId] = workspaceLayers[layerId];
          return visibleLayers;
        }
        return visibleLayers;
      }, {}),
    [workspaceLayers],
  );

  // Api.
  const {
    data: featuresResponse,
    isFetching: isLoadingFeaturesResponse,
    isSuccess: isSuccessFeaturesResponse,
    isError: isErrorFeaturesResponse,
    error: featuresResponseError,
    refetch: refetchFeatures,
  } = useFeatureList(
    values.workspaceLayer?.value.id ?? null,
    FeatureType.LineString,
    false,
  );

  const {
    data: polygonFeaturesResponse,
    isFetching: isLoadingPolygonFeaturesResponse,
    isSuccess: isSuccessPolygonFeaturesResponse,
    isError: isErrorPolygonFeaturesResponse,
    error: polygonFeaturesResponseError,
    refetch: refetchPolygonFeatures,
  } = useFeatureList(
    values.haulRoadMedianLayer?.value.id ?? null,
    FeatureType.Polygon,
    false,
  );

  const {
    data: haulRoadTypeResponse,
    error: haulRoadTypeResponseError,
    isError: isErrorHaulRoadTypeResponse,
    isSuccess: isSuccessHaulRoadType,
    isLoading: isLoadingHaulRoadType,
  } = useHaulRoadTypes();

  const {
    mutate: sendAddHaulRoadRequest,
    data: addHaulRoadResponse,
    error: addHaulRoadResponseError,
    isError: isErrorAddHaulRoadResponse,
    isPending: isAddHaulRoadPending,
    isSuccess: isSuccessAddHaulRoad,
  } = useAddHaulRoad();

  const lineLayersSelectOptions =
    currentHRLayerType === HaulRoadLayerType.CenterLineLayer
      ? singleLineLayersSelectOptions
      : twoLineLayersSelectOptions;

  // useEffects.
  useEffect(() => {
    if (cesiumProxy) {
      lineTool.current = new LineTool(cesiumProxy?.cesiumViewer);
      polygonTool.current = new PolygonTool(cesiumProxy?.cesiumViewer);
    }

    // Set initial optional fields.
    setOptional({
      ...optional,
      haulRoadMedianLayer: true,
      workspaceLayer: true,
      haulRoadLayersType: true,
    });

    return () => {
      setVectorLayerVisibility(workspaceLayers, true);
      lineTool.current?.deleteAllLines();
      lineTool.current?.deactivate();
      polygonTool.current?.deleteAllPolygons();
    };
  }, []);

  useEffect(() => {
    handleResponseErrorMessage(isErrorFeaturesResponse, featuresResponseError);
  }, [isErrorFeaturesResponse, featuresResponseError]);

  useEffect(() => {
    handleResponseErrorMessage(
      isErrorHaulRoadTypeResponse,
      haulRoadTypeResponseError,
    );
  }, [haulRoadTypeResponseError, isErrorHaulRoadTypeResponse]);

  useEffect(() => {
    if (isSuccessHaulRoadType && haulRoadTypeResponse) {
      setHaulRoadTypeOptions(
        haulRoadTypeResponse.map((haulRoadType) => ({
          label: haulRoadType.name,
          value: haulRoadType.id,
        })),
      );
    }
  }, [haulRoadTypeResponse, isSuccessHaulRoadType]);

  useEffect(() => {
    handleResponseErrorMessage(
      isErrorHaulRoadTypeResponse,
      addHaulRoadResponseError,
    );
  }, [addHaulRoadResponseError, isErrorAddHaulRoadResponse]);

  useEffect(() => {
    handleResponseErrorMessage(
      isErrorPolygonFeaturesResponse,
      polygonFeaturesResponseError,
    );
  }, [isErrorPolygonFeaturesResponse, polygonFeaturesResponseError]);

  useEffect(() => {
    if (isSuccessAddHaulRoad) {
      setShowGenerateForm(false);
      handleResponseSuccessMessage(isSuccessAddHaulRoad, addHaulRoadResponse);
    }
  }, [isSuccessAddHaulRoad]);

  useEffect(() => {
    if (isSuccessFeaturesResponse && !isNil(featuresResponse)) {
      loadLinesFromWorkspace(featuresResponse.data.features);
    }
  }, [isSuccessFeaturesResponse, featuresResponse]);

  useEffect(() => {
    if (isSuccessPolygonFeaturesResponse && !isNil(polygonFeaturesResponse)) {
      loadPolygonFromWorkspace(polygonFeaturesResponse.data.features);
    }
  }, [isSuccessPolygonFeaturesResponse, polygonFeaturesResponse]);

  useEffect(() => {
    if (isNil(values.workspaceLayer)) {
      return;
    }

    refetchFeatures();
    deleteHRLinesByMarkedArea(HRALineOptions.Draw);

    const features = values.workspaceLayer?.value.features;
    const selectedHRLinesIds: Array<string> | undefined = features?.map(
      (feature) => {
        return feature.id;
      },
    );
    deleteHRLinesByMarkedArea(
      HRALineOptions.LayerFromWorkspace,
      selectedHRLinesIds,
    );
  }, [values.workspaceLayer]);

  useEffect(() => {
    if (isNil(values.haulRoadMedianLayer)) {
      return;
    }
    refetchPolygonFeatures();
    deleteHRPolygonsByMarkedArea(HRALineOptions.LayerFromWorkspace);
  }, [values.haulRoadMedianLayer]);

  useEffect(() => {
    // Show the workspace layers when moved away from the HRA tab.
    return () => {
      if (currentMarkedArea === HRALineOptions.Draw) {
        setVectorLayerVisibility(visibleWorkspaceLayers, true);
      } else {
        setVectorLayerVisibility(workspaceLayers, false);
      }
    };
  }, [workspaceLayers]);

  // Handlers
  const onSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();

    if (
      !lineTool.current &&
      !values.workspaceLayer?.value.id &&
      !inputHasError(getOptionalFields())
    ) {
      return;
    }

    const {
      haulRoadName,
      haulRoadType,
      vehicleWidth,
      chainageInterval,
      haulRoadLayersType,
      workspaceLayer,
      haulRoadMedianLayer,
    } = values;

    const haulRoadPayLoad: AddHaulRoadPayload = {
      name: haulRoadName,
      type: haulRoadType?.value,
      vehicleWidth: vehicleWidth,
      chainageInterval: chainageInterval,
      iteration: selectedTerrainIteration?.id,
    };

    if (!isNil(workspaceLayer)) {
      if (haulRoadLayersType.value === HaulRoadLayerType.CenterLineLayer) {
        haulRoadPayLoad.centerLineLayer = workspaceLayer.value.id;
      } else {
        haulRoadPayLoad.edgeLayer = workspaceLayer.value.id;
        if (haulRoadMedianLayer?.value) {
          haulRoadPayLoad.mediansLayer = haulRoadMedianLayer.value.id;
        }
      }
    } else {
      haulRoadPayLoad.smartLineWkt =
        lineTool.current?.exportCurrentLinesToWKT()[0].wkt ?? '';
    }

    sendAddHaulRoadRequest(haulRoadPayLoad);
  };

  const resetHRAlines = () => {
    if (lineTool.current?.isAnyLineDrawn) {
      lineTool.current?.deleteAllLines();
    }
  };

  const onRadioChange = (event) => {
    haulRoadLayersType.forEach((layerType) => {
      if (event.target.title === layerType.value) {
        setCurrentHRLayerType(event.target.title);
        setValues({
          ...values,
          haulRoadLayersType: layerType,
          workspaceLayer: null,
          haulRoadMedianLayer: null,
        });
      }
      deleteHRPolygonsByMarkedArea(HRALineOptions.LayerFromWorkspace);
      deleteHRLinesByMarkedArea(HRALineOptions.LayerFromWorkspace);
    });

    if (
      (values.haulRoadLayersType.value === HaulRoadLayerType.CenterLineLayer &&
        singleLineLayersSelectOptions.length === 0) ||
      isNil(singleLineLayersSelectOptions)
    ) {
      setErrors({
        ...errors,
        workspaceLayer: FormErrorMessages.NoActiveEdgeLineLayer,
      });
    }
    if (
      (values.haulRoadLayersType.value === HaulRoadLayerType.EdgesLayer &&
        twoLineLayersSelectOptions.length === 0) ||
      isNil(twoLineLayersSelectOptions)
    ) {
      setErrors({
        ...errors,
        workspaceLayer: FormErrorMessages.NoActiveCenterLineLayer,
      });
    }
  };

  const startDrawingHandler = () => {
    resetHRAlines();
    lineTool.current?.activate(
      { haulRoadLines: HRALineOptions.Draw },
      {},
      true,
    );
    polygonTool.current?.deleteAllPolygons();
    dispatch(setCurrentActiveMapTool(MapTool.None));
    deleteHRLinesByMarkedArea(HRALineOptions.LayerFromWorkspace);
    deleteHRPolygonsByMarkedArea(HRALineOptions.LayerFromWorkspace);
    setVectorLayerVisibility(workspaceLayers, false);
    setIsDrawLineToolEnabled(true);
    setValues({
      ...values,
      workspaceLayer: null,
      haulRoadMedianLayer: null,
    });
  };

  const endDrawingHandler = () => {
    lineTool.current?.deactivate();
    setIsDrawLineToolEnabled(false);
  };

  const onToggleChange = (toggledValue) => {
    if (toggledValue === HRALineOptions.Draw) {
      setCurrentMarkedArea(HRALineOptions.Draw);
      deleteHRLinesByMarkedArea(HRALineOptions.LayerFromWorkspace);
      deleteHRPolygonsByMarkedArea(HRALineOptions.LayerFromWorkspace);
      setVectorLayerVisibility(visibleWorkspaceLayers, false);
      setIsDrawLineToolEnabled(false);

      setErrors({
        ...errors,
        workspaceLayer: '',
      });

      setValues({
        ...values,
        workspaceLayer: null,
      });

      setOptional({
        ...optional,
        workspaceLayer: true,
        haulRoadLayersType: true,
      });
    } else {
      setCurrentMarkedArea(HRALineOptions.LayerFromWorkspace);
      setVectorLayerVisibility(workspaceLayers, false);
      deleteHRLinesByMarkedArea(HRALineOptions.Draw);
      lineTool.current?.deactivate();

      setOptional({
        ...optional,
        workspaceLayer: false,
        haulRoadLayersType: false,
      });

      if (
        (values.haulRoadLayersType.value ===
          HaulRoadLayerType.CenterLineLayer &&
          singleLineLayersSelectOptions.length === 0) ||
        isNil(singleLineLayersSelectOptions)
      ) {
        setErrors({
          ...errors,
          workspaceLayer: FormErrorMessages.NoActiveCenterLineLayer,
        });
      }
    }
  };

  const loadLinesFromWorkspace = (featureResponse: FeatureResponseData[]) => {
    for (const feature of featureResponse) {
      if (feature.type === FeatureType.LineString) {
        lineTool.current?.importWKT(
          feature.geometry,
          feature.id,
          {
            haulRoadLines: HRALineOptions.LayerFromWorkspace,
          },
          feature.name,
        );
      }
    }
  };

  const loadPolygonFromWorkspace = (featureResponse: FeatureResponseData[]) => {
    for (const feature of featureResponse) {
      if (feature.type === FeatureType.Polygon) {
        polygonTool.current?.importWKT(
          feature.geometry,
          feature.id,
          {
            haulRoadPolygons: HRALineOptions.LayerFromWorkspace,
          },
          feature.name,
        );
      }
    }
  };

  const onClickNewHaulRoad = () => {
    setShowGenerateForm(true);
    setValues({
      ...values,
      haulRoadName: '',
      workspaceLayer: null,
      haulRoadMedianLayer: null,
    });
  };

  const onClickViewOutputs = () => {
    setActiveTabKey(haulRoadAnalyticsTabs.Outputs);
  };

  const deleteHRLinesByMarkedArea = (
    markArea: HRALineOptions,
    excludeLines?: string[],
  ) => {
    const hrLines = lineTool.current
      ?.getLinesByProperty('haulRoadLines', markArea)
      .map((hrLine) => {
        return hrLine.id;
      });

    const linesToDelete = xor(hrLines, excludeLines);

    for (const line of linesToDelete) {
      lineTool.current?.deleteById(line);
    }
  };

  const deleteHRPolygonsByMarkedArea = (markArea: HRALineOptions) => {
    const hrPolygons = polygonTool.current
      ?.getPolygonByProperty('haulRoadPolygons', markArea)
      .map((polygon) => {
        return polygon.id;
      });

    if (isNil(hrPolygons)) {
      return;
    }

    for (const polygon of hrPolygons) {
      polygonTool.current?.deleteById(polygon);
    }
  };

  return showGenerateHaulRoadForm ? (
    <form className="hra-generate-form-container" onSubmit={onSubmit}>
      <div className="input-field-container map-3d-sidebar-content">
        <InputGroup className="input-field--bold">
          <Input.Label>Active Iteration</Input.Label>
          <Input.Text disabled value={selectedTerrainIteration?.name} />
        </InputGroup>
        <InputGroup className="input-field--bold">
          <Input.Label>Haul Road Name</Input.Label>
          <Input.Text
            placeholder="Haul Road Name"
            value={values.haulRoadName}
            name={names.haulRoadName}
            error={errors.haulRoadName}
            isInvalid={!!errors.haulRoadName}
            disabled={isDrawLineToolEnabled}
            required
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>
        <InputGroup className="hra-generate-form__drawing input-field--bold">
          <Input.Label>
            Mark Origin & Destination Points{' '}
            <Tooltip
              hoverText="Use Smart Line to draw origin destination, midpoints and connecting lines."
              placement={Placement.Top}
            >
              <Icon
                identifier={IconIdentifier.InfoCircle}
                size={16}
                colorClass={ColorClass.Primary500}
              />
            </Tooltip>
          </Input.Label>
          <ToggleSwitch
            leftTitle={HRALineOptions.Draw}
            rightTitle={HRALineOptions.LayerFromWorkspace}
            leftSelected={currentMarkedArea === HRALineOptions.Draw}
            onChange={onToggleChange}
          />
        </InputGroup>
        {currentMarkedArea === HRALineOptions.Draw ? (
          <>
            {isDrawLineToolEnabled ? (
              <Button
                variant={ButtonVariant.Primary}
                leftIconIdentifier={IconIdentifier.Line}
                onClick={endDrawingHandler}
              >
                Exit Drawing Mode
              </Button>
            ) : (
              <Button
                variant={ButtonVariant.Outline}
                leftIconIdentifier={IconIdentifier.Polygon}
                onClick={startDrawingHandler}
                disabled={isDrawLineToolEnabled}
              >
                Enter Drawing Mode
              </Button>
            )}
          </>
        ) : (
          <>
            <InputGroup className="input-field--bold">
              <Input.Label>Haul Road Layers</Input.Label>
              <RadioToggleGroup
                radioOptions={haulRoadLayersType}
                onChange={(event) => {
                  onRadioChange(event);
                }}
                checked={(option) => {
                  return values.haulRoadLayersType.value === option.value;
                }}
              />
            </InputGroup>
            <InputGroup>
              <Input.Label>Select Layer</Input.Label>
              <Input.Select
                placeholder="Select Layer from Workspace"
                options={lineLayersSelectOptions}
                value={values.workspaceLayer}
                name={names.workspaceLayer}
                isLoading={isLoadingFeaturesResponse}
                onChange={(selectedLayer: SelectOption<WorkspaceLayer>) => {
                  setValues({ ...values, workspaceLayer: selectedLayer });
                }}
                {...{ onBlur, onFocus }}
              />
            </InputGroup>
            {errors.workspaceLayer && (
              <FormMessage message={errors.workspaceLayer} />
            )}
          </>
        )}

        <InputGroup>
          <Input.Label>Haul Road Type</Input.Label>
          <Input.Select
            options={haulRoadTypeOptions}
            value={values.haulRoadType}
            name={names.haulRoadType}
            isLoading={isLoadingHaulRoadType}
            placeholder="Haul Road Type"
            onChange={(haulRoadType) => {
              setValues({
                ...values,
                haulRoadType,
              });
            }}
            error={errors.haulRoadType}
            {...{ onBlur }}
          />
        </InputGroup>

        <InputGroup>
          <Input.Label>
            Vehicle Width (m){' '}
            <Tooltip
              hoverText="Enter a positive number up to 100m."
              placement={Placement.TopStart}
            >
              <Icon
                identifier={IconIdentifier.InfoCircle}
                size={16}
                colorClass={ColorClass.Primary500}
              />
            </Tooltip>
          </Input.Label>
          <Input.Number
            value={values.vehicleWidth}
            name={names.vehicleWidth}
            error={errors.vehicleWidth}
            isInvalid={!!errors.vehicleWidth}
            min={1}
            max={100}
            onKeyDown={preventNonNumber}
            disabled={isDrawLineToolEnabled}
            placeholder="Vehicle Width"
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>
        <InputGroup>
          <Input.Label>
            Chainage Interval{' '}
            <Tooltip
              hoverText="Enter a positive number up to 500m."
              placement={Placement.BottomStart}
            >
              <Icon
                identifier={IconIdentifier.InfoCircle}
                size={16}
                colorClass={ColorClass.Primary500}
              />
            </Tooltip>
          </Input.Label>
          <Input.Number
            value={values.chainageInterval}
            name={names.chainageInterval}
            error={errors.chainageInterval}
            isInvalid={!!errors.chainageInterval}
            min={1}
            max={500}
            onKeyDown={preventNonInteger}
            disabled={isDrawLineToolEnabled}
            placeholder="Chainage Interval"
            {...{ onChange, onBlur, onFocus }}
          ></Input.Number>
        </InputGroup>
        {currentMarkedArea === HRALineOptions.LayerFromWorkspace &&
          currentHRLayerType === HaulRoadLayerType.EdgesLayer && (
            <Accordion
              variant={AccordionVariant.ChevronRight}
              defaultActiveKey="optional-fields"
            >
              <Accordion.Item
                title="Optional Fields"
                eventKey="optional-fields"
              >
                <InputGroup>
                  <Input.Label>
                    Haul Road Median Layer (
                    <span className="optional-name">optional</span>){' '}
                    <Tooltip
                      hoverText="Select a Haul Road Median layer with polygons"
                      placement={Placement.BottomStart}
                    >
                      <Icon
                        identifier={IconIdentifier.InfoCircle}
                        size={16}
                        colorClass={ColorClass.Primary500}
                      />
                    </Tooltip>
                  </Input.Label>
                  <Input.Select
                    placeholder="Select Median Layer from Workspace"
                    options={polygonLayersSelectOption}
                    value={values.haulRoadMedianLayer}
                    name={names.haulRoadMedianLayer}
                    isLoading={isLoadingPolygonFeaturesResponse}
                    menuPlacement="top"
                    onChange={(selectedLayer: SelectOption<WorkspaceLayer>) => {
                      setValues({
                        ...values,
                        haulRoadMedianLayer: selectedLayer,
                      });
                    }}
                    {...{ onBlur, onFocus }}
                  />
                </InputGroup>
              </Accordion.Item>
            </Accordion>
          )}
      </div>

      <div className="submit-btn">
        <Button
          onClick={onSubmit}
          isLoading={isAddHaulRoadPending}
          variant={ButtonVariant.Primary}
          type="submit"
          disabled={isGenerateHRADisabled}
        >
          Generate Haul Road
        </Button>
      </div>
    </form>
  ) : (
    <HRAViewOutputs
      onClickNewHaulRoad={onClickNewHaulRoad}
      onClickViewOutputs={onClickViewOutputs}
    />
  );
};
