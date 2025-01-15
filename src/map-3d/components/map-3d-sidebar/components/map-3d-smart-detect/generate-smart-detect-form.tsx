import {
  Button,
  ButtonVariant,
  CheckBox,
  CheckboxAlignment,
  Divider,
  IconIdentifier,
  Input,
  InputGroup,
  SelectOption,
  toast,
  ToggleSwitch,
} from '@aus-platform/design-system';
import { filter, isEmpty, without } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Polygon } from 'ol/geom';
import { MapTool } from '../../../map-3d-container/map-3d-tools';
import { setVectorLayerVisibility } from '../map-3d-workspace';
import {
  SmartDetectMarkArea,
  SmartDetectOutput,
  SmartDetectOutputMapping,
} from './enums';
import { useAppSelector } from 'src/app/hooks';
import { IPolygonTool, PolygonTool } from 'src/map-3d/shared';
import {
  selectActiveWorkspaceLayersByFeatureType,
  selectMap3dDataset,
  selectMap3DState,
  selectMap3dWorkspace,
  setCurrentActiveMapTool,
} from 'src/map-3d/shared/map-3d-slices';
import {
  FeatureGeometryType,
  LayerType,
  SmartDetectCreatePayload,
} from 'src/shared/api';
import { useAddSmartDetectRequest } from 'src/shared/api/workspace/smart-detect-api';
import { Formatter } from 'src/shared/helpers';
import { useInputFields } from 'src/shared/hooks';

const smartDetectOutputs: SmartDetectOutput[] = [
  SmartDetectOutput.BenchToeCrest,
  SmartDetectOutput.BuildingFootprintsOrRoofTops,
  SmartDetectOutput.DrainageAnalysis,
  SmartDetectOutput.HeapDetection,
  SmartDetectOutput.PondsAndLakes,
  SmartDetectOutput.RiversAndStreams,
  SmartDetectOutput.TreeCanopies,
  SmartDetectOutput.MetalledRoads,
  SmartDetectOutput.UnMetalledRoads,
];

type SmartDetectFormValues = {
  activeOrtho: SelectOption | null;
  selectedOutputs: string[];
  smartDetectOutputNames: Record<SmartDetectOutput, string>;
  smartAreaWkt?: Polygon;
  inputAOILayer?: string;
  inDrawingMode: boolean;
};

const initialSmartDetectFormValues: SmartDetectFormValues = {
  activeOrtho: null,
  selectedOutputs: [],
  smartAreaWkt: undefined,
  inputAOILayer: undefined,
  smartDetectOutputNames: Object.fromEntries(
    smartDetectOutputs.map((output) => [output, '']),
  ) as Record<SmartDetectOutput, string>,
  inDrawingMode: false,
};

export const GenerateSmartDetectForm = () => {
  const dispatch = useDispatch();
  const polygonTool = useRef<IPolygonTool>();

  // Selectors.
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const { workspaceLayers } = useAppSelector(selectMap3dWorkspace);
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);

  // States.
  const [currentMarkedArea, setCurrentMarkedArea] =
    useState<SmartDetectMarkArea>(SmartDetectMarkArea.Draw);

  // Hooks.
  const { values, errors, onBlur, onFocus, setValues } = useInputFields(
    initialSmartDetectFormValues,
  );

  // TODO: Add isSuccess and isError and corresponding handlers.
  const { mutate, isPending } = useAddSmartDetectRequest();

  const activeOrthoOptions = useMemo(() => {
    return filter(workspaceLayers, {
      type: LayerType.Orthomosaic,
    }).map((layer) => ({ label: layer.name, value: layer.id }));
  }, [workspaceLayers]);

  const activeLayers = useAppSelector((state) =>
    selectActiveWorkspaceLayersByFeatureType(
      state,
      FeatureGeometryType.Polygon,
    ),
  );

  const polygonLayersSelectOption: SelectOption[] = activeLayers.map(
    (activeLayer) => ({
      label: activeLayer.name,
      value: activeLayer.id,
    }),
  );

  const isParentCheckboxChecked = useMemo(
    () => values.selectedOutputs.length === smartDetectOutputs.length,
    [values.selectedOutputs],
  );

  const isParentCheckboxIndeterminate = useMemo(
    () =>
      values.selectedOutputs.length > 0 &&
      values.selectedOutputs.length < smartDetectOutputs.length,
    [values.selectedOutputs],
  );

  useEffect(() => {
    if (cesiumProxy) {
      polygonTool.current = new PolygonTool(cesiumProxy.cesiumViewer);
    }
    return () => {
      setVectorLayerVisibility(workspaceLayers, true);
      polygonTool.current?.deleteAllPolygons();
      polygonTool.current?.deactivate();
    };
  }, []);

  // Handlers.
  const handleDrawToggle = () => {
    const newDrawingMode = !values.inDrawingMode;
    if (newDrawingMode) {
      polygonTool.current?.activate({
        heapMarkArea: SmartDetectMarkArea.Draw,
      });
      dispatch(setCurrentActiveMapTool(MapTool.None));
      setVectorLayerVisibility(workspaceLayers, false);
    } else {
      if (polygonTool.current) {
        polygonTool.current.deactivate();
      }
      setVectorLayerVisibility(workspaceLayers, true);
    }
    setValues((prev) => ({ ...prev, inDrawingMode: newDrawingMode }));
  };

  const handleParentCheckboxClick = () => {
    const newSelectedOutputs = !isParentCheckboxChecked
      ? [...smartDetectOutputs]
      : [];

    setValues((prev) => ({
      ...prev,
      selectedOutputs: newSelectedOutputs,
      smartDetectOutputNames: Object.fromEntries(
        smartDetectOutputs.map((output) => [
          output,
          newSelectedOutputs.includes(output)
            ? `${output}_${values.activeOrtho?.label || ''}`
            : '',
        ]),
      ) as Record<SmartDetectOutput, string>,
    }));
  };

  const handleOutputSelect = (output: string) => {
    const newSelectedOutputs = values.selectedOutputs.includes(output)
      ? without(values.selectedOutputs, output)
      : [...values.selectedOutputs, output];

    setValues((prev) => ({
      ...prev,
      selectedOutputs: newSelectedOutputs,
      smartDetectOutputNames: {
        ...prev.smartDetectOutputNames,
        [output]: `${output}_${values.activeOrtho?.label || ''}`,
      },
    }));
  };

  const handleOrthoSelect = (option: SelectOption | null) => {
    setValues((prev) => ({
      ...prev,
      activeOrtho: option,
      //Below, changing the default output names based on active ortho.
      smartDetectOutputNames: Object.fromEntries(
        smartDetectOutputs.map((output) => [
          output,
          prev.selectedOutputs.includes(output)
            ? `${output}_${option?.label || ''}`
            : '',
        ]),
      ) as Record<SmartDetectOutput, string>,
    }));
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const output = name.split('.')[1] as SmartDetectOutput;

    setValues((prev) => ({
      ...prev,
      smartDetectOutputNames: {
        ...prev.smartDetectOutputNames,
        [output]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SmartDetectCreatePayload = {
      iteration: selectedTerrainIteration?.id || '',
      inputOrthoLayer: values.activeOrtho?.value || '',
      smartDetectOutputs: values.selectedOutputs.map((output) => ({
        outputType: SmartDetectOutputMapping[output],
        name: values.smartDetectOutputNames[output] as string,
      })),
    };
    if (polygonTool.current?.isAnyPolygonDrawn) {
      let wktString: string | null = null;
      const polygonIds = polygonTool.current?.currentDrawnPolygonIds;
      if (polygonIds.length > 1) {
        toast.error('Please draw only one polygon.');
        return;
      }
      const polygon = polygonTool.current?.currentDrawnPolygons[polygonIds[0]];
      if (isEmpty(polygonIds)) {
        toast.error('Please draw a polygon first.');
        return;
      }
      wktString = polygon.exportWKT().wkt;
      payload.smartAreaWkt = wktString;
    }
    if (values.inputAOILayer) {
      payload.inputAOILayer = values.inputAOILayer;
    }
    mutate(payload);
  };

  const isSubmitDisabled =
    !values.activeOrtho || values.selectedOutputs.length === 0;

  const isOutputSelectDisabled = () => {
    if (currentMarkedArea === SmartDetectMarkArea.Draw) {
      return !polygonTool.current?.isAnyPolygonDrawn;
    } else {
      return !values.inputAOILayer;
    }
  };

  const onToggleChange = (toggledLabel) => {
    const toggledValue = Formatter.camelCaseToSnakeCase(
      toggledLabel.split(' ').join(''),
    );

    setCurrentMarkedArea(toggledValue as SmartDetectMarkArea);
  };

  return (
    <form className="generate-smart-detect__form" onSubmit={handleSubmit}>
      <InputGroup>
        <Input.Label>Active Orthomosaic</Input.Label>
        <Input.Select
          options={activeOrthoOptions}
          value={values.activeOrtho}
          onChange={handleOrthoSelect}
          error={errors.activeOrtho}
          isClearable={false}
        />
      </InputGroup>

      <Divider text="" />

      <InputGroup className="volume-calculation__drawing">
        <Input.Label className="volume-calculation__drawing__heading">
          Mark Area
        </Input.Label>
        <ToggleSwitch
          leftTitle={Formatter.toTitleCase(SmartDetectMarkArea.Draw, '_')}
          rightTitle={Formatter.toTitleCase(
            SmartDetectMarkArea.LayerFromWorkspace,
            '_',
          )}
          leftSelected={currentMarkedArea === SmartDetectMarkArea.Draw}
          onChange={onToggleChange}
        />
        {currentMarkedArea === SmartDetectMarkArea.Draw ? (
          <Button
            onClick={handleDrawToggle}
            leftIconIdentifier={IconIdentifier.Polygon}
            variant={
              values.inDrawingMode
                ? ButtonVariant.Primary
                : ButtonVariant.Outline
            }
            disabled={!values.activeOrtho}
          >
            {values.inDrawingMode ? 'Exit Drawing Mode' : 'Enter Drawing Mode'}
          </Button>
        ) : (
          <InputGroup className="volume-calculation__select-layer">
            <Input.Label>Select Layer</Input.Label>
            <Input.Select
              placeholder="Select Layer from Workspace"
              options={polygonLayersSelectOption}
              value={values.smartAreaWkt}
              onChange={(selectedLayer: SelectOption) => {
                setValues({ ...values, inputAOILayer: selectedLayer.value }); // TODO: Change this
              }}
              {...{ onBlur, onFocus }}
            />
          </InputGroup>
        )}
      </InputGroup>

      <Divider text="" />

      <InputGroup className="generate-smart-detect__form__select-output">
        <div className="generate-smart-detect__form__select-output__parent-checkbox">
          <Input.Label>Select Outputs</Input.Label>
          <Input.CheckBox
            checked={isParentCheckboxChecked}
            indeterminate={isParentCheckboxIndeterminate}
            onClick={handleParentCheckboxClick}
            disabled={isOutputSelectDisabled()}
          />
        </div>

        {smartDetectOutputs.map((output) => (
          <div key={output}>
            <CheckBox
              title={output}
              checked={values.selectedOutputs.includes(output)}
              alignCheckbox={CheckboxAlignment.Right}
              onClick={() => handleOutputSelect(output)}
              disabled={isOutputSelectDisabled()}
              showCard
            />
            {values.selectedOutputs.includes(output) && (
              <Input.Text
                name={`smartDetectOutputNames.${output}`}
                className="generate-smart-detect__form__select-output__text"
                value={values.smartDetectOutputNames[output]}
                onChange={handleTextChange}
                {...{ onBlur, onFocus }}
              />
            )}
          </div>
        ))}
      </InputGroup>

      <Button
        type="submit"
        className="generate-smart-detect__form__submit-btn"
        disabled={isSubmitDisabled}
        isLoading={isPending}
      >
        Generate Smart Detect
      </Button>
    </form>
  );
};
