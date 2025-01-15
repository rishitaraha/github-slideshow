import {
  Button,
  ButtonVariant,
  CheckBox,
  CheckboxAlignment,
  Divider,
  IconIdentifier,
  Input,
  InputGroup,
  toast,
} from '@aus-platform/design-system';
import { without } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../../../../app/hooks';
import {
  handleResponseMessage,
  useAnalyticsRequest,
} from '../../../../../shared/api';
import {
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dWorkspace,
  setCurrentActiveMapTool,
} from '../../../../shared/map-3d-slices';
import { IPolygonTool, PolygonTool } from '../../../../shared/map-3d-tools';
import { MapTool } from '../../../map-3d-container/map-3d-tools';
import { setVectorLayerVisibility } from '../map-3d-workspace';
import { AnalyticsOutput } from './enums';

const analyticsOutput: AnalyticsOutput[] = [
  AnalyticsOutput.BenchAnalysis,
  AnalyticsOutput.HaulRoadGradient,
  AnalyticsOutput.HaulRoadWidth,
  AnalyticsOutput.DrainageAnalytics,
];

export const GenerateRoadAnalytics: React.FC<{
  setShowAnalyticsForm: (boolean) => void;
}> = ({ setShowAnalyticsForm }) => {
  // State.
  const [inDrawingMode, setInDrawingMode] = useState(false);
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([]);
  const [inputIsDisabled, setInputIsDisabled] = useState(false);

  // Selectors.
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);
  const { workspaceLayers } = useAppSelector(selectMap3dWorkspace);
  const dispatch = useDispatch();

  // Ref.
  const polygonTool = useRef<IPolygonTool>();

  // Api.
  const {
    mutate: sendAnalyticsRequest,
    isPending: isAnalyticsRequestLoading,
    data: analyticsResponse,
    isSuccess: isAnalyticsRequestSuccess,
    isError: isAnalyticsRequestError,
    error: analyticsRequestError,
  } = useAnalyticsRequest();

  // useEffects.
  useEffect(() => {
    if (cesiumProxy) {
      polygonTool.current = new PolygonTool(cesiumProxy?.cesiumViewer);
    }

    return () => {
      setVectorLayerVisibility(workspaceLayers, true);
      polygonTool.current?.deleteAllPolygons();
      polygonTool.current?.deactivate();
    };
  }, []);

  useEffect(() => {
    handleResponseMessage(
      isAnalyticsRequestSuccess,
      isAnalyticsRequestError,
      analyticsResponse,
      analyticsRequestError,
    );
    if (isAnalyticsRequestSuccess) {
      setVectorLayerVisibility(workspaceLayers, true);
      setInputIsDisabled(false);
      setShowAnalyticsForm(false);
    }
  }, [analyticsResponse, isAnalyticsRequestSuccess, isAnalyticsRequestError]);

  // useMemo.
  const isParentCheckboxChecked = useMemo(() => {
    return selectedOutputs.length === analyticsOutput.length;
  }, [selectedOutputs]);

  const isParentCheckboxIndeterminate = useMemo(() => {
    return (
      selectedOutputs.length > 0 &&
      selectedOutputs.length < analyticsOutput.length
    );
  }, [selectedOutputs]);

  const isSubmitButtonDisabled =
    selectedOutputs.length < 1 || !polygonTool.current?.isAnyPolygonDrawn;

  // Handlers.
  const onDrawBtnClick = () => {
    if (!inDrawingMode) {
      polygonTool.current?.activate({ isRoadAnalytics: true }, {}, true);
      dispatch(setCurrentActiveMapTool(MapTool.None));
      setVectorLayerVisibility(workspaceLayers, false);
    } else {
      polygonTool.current?.deactivate();
      setVectorLayerVisibility(workspaceLayers, true);
    }
    setInDrawingMode(!inDrawingMode);
  };

  const onClickParentCheckbox = () => {
    let updatedSelectedOutputs: string[] = [];
    if (!isParentCheckboxChecked && !isParentCheckboxIndeterminate) {
      updatedSelectedOutputs = [...analyticsOutput];
    }
    setSelectedOutputs(updatedSelectedOutputs);
  };

  const onClickCheckbox = (output: string) => {
    let updatedSelectedOutputs = [...selectedOutputs];
    if (updatedSelectedOutputs.includes(output)) {
      updatedSelectedOutputs = without(updatedSelectedOutputs, output);
    } else {
      updatedSelectedOutputs.push(output);
    }
    setSelectedOutputs([...updatedSelectedOutputs]);
  };

  const onSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (
      !polygonTool.current?.isAnyPolygonDrawn &&
      !polygonTool.current?.isAnyPolygonLoaded
    ) {
      toast.error('Please draw a polygon first.');
      return;
    }
    setInputIsDisabled(true);
    const polygonWkt = polygonTool.current?.exportCurrentPolygonsToWkt();
    if (selectedTerrainIteration) {
      sendAnalyticsRequest({
        polygonWkt: polygonWkt[0].wkt,
        selectedOutputs,
        iterationId: selectedTerrainIteration.id,
      });
    }
  };

  return (
    <form className="generate-road-analytics__form" onSubmit={onSubmit}>
      <InputGroup className="generate-road-analytics__form__draw-section">
        <Input.Label>Mark Area</Input.Label>
        <Button
          onClick={onDrawBtnClick}
          leftIconIdentifier={IconIdentifier.Polygon}
          variant={
            inDrawingMode ? ButtonVariant.Primary : ButtonVariant.Outline
          }
          disabled={inputIsDisabled}
        >
          {inDrawingMode ? 'Exit Drawing Mode' : 'Enter Drawing Mode'}
        </Button>
      </InputGroup>
      <Divider text={''} />
      <InputGroup className="generate-road-analytics__form__select-output">
        <div className="generate-road-analytics__form__select-output__parent-checkbox">
          <Input.Label>Select Outputs</Input.Label>
          <Input.CheckBox
            checked={isParentCheckboxChecked}
            indeterminate={isParentCheckboxIndeterminate}
            onClick={onClickParentCheckbox}
            disabled={inputIsDisabled}
          />
        </div>
        {analyticsOutput.map((output, index) => (
          <CheckBox
            title={output}
            key={index}
            checked={selectedOutputs.includes(output)}
            alignCheckbox={CheckboxAlignment.Right}
            onClick={() => onClickCheckbox(output)}
            disabled={inputIsDisabled}
            showCard={true}
          />
        ))}
      </InputGroup>
      <div className="generate-road-analytics__form__submit-btn__container">
        <Button
          type="submit"
          className="generate-road-analytics__form__submit-btn"
          disabled={isSubmitButtonDisabled}
          isLoading={isAnalyticsRequestLoading}
        >
          Generate Analytics
        </Button>
      </div>
    </form>
  );
};
