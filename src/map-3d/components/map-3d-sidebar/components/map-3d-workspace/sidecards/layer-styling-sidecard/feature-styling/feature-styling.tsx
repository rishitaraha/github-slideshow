import {
  Accordion,
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  AccordionVariant,
} from '@aus-platform/design-system';
import React, { useEffect } from 'react';
import {
  featureInputInitialState,
  featureStylingInputToFeatureStylesMapper,
  featuresStylesToFeatureStylingInputMapper,
} from './helpers';
import { handleResponseMessage, useUpdateLayer } from 'shared/api';
import { preventNonNumber } from 'shared/helpers';
import { useInputFields } from 'shared/hooks';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
  selectMap3dWorkspace,
  selectWorkspaceActionableLayers,
  updateWorkspaceLayer,
} from 'map-3d/shared/map-3d-slices';
import { OpacitySlider } from 'src/shared/components';

export const FeatureStyling: React.FC = () => {
  // Selectors.
  const { drawingTools } = useAppSelector(selectMap3dWorkspace);
  const { currentEditableLayer } = useAppSelector(
    selectWorkspaceActionableLayers,
  );

  const dispatch = useAppDispatch();

  // Hooks.
  const {
    values,
    dirty,
    setValues,
    names,
    onChange,
    onBlur,
    onFocus,
    inputIsDirty,
    setDirty,
  } = useInputFields(featureInputInitialState);

  // APIs.
  const {
    mutate: sendUpdateLayerRequest,
    data: updateLayerResponse,
    isPending: isLoadingUpdateLayer,
    isSuccess: isSuccessUpdateLayer,
    isError: isErrorUpdateLayer,
    error: updateLayerErrorResponse,
  } = useUpdateLayer();

  // useEffects.
  useEffect(() => {
    if (currentEditableLayer && currentEditableLayer.featuresStyles) {
      const { featuresStyles, id } = currentEditableLayer;
      const { polygon, line, point, textbox } = featuresStyles;

      drawingTools?.applyStylesToFeatures(id, {
        polygonStyleOptions: polygon,
        lineStyleOptions: line,
        pointStyleOptions: point,
        textboxStyleOptions: textbox,
      });

      setValues(featuresStylesToFeatureStylingInputMapper(featuresStyles));
    }
  }, [currentEditableLayer]);

  useEffect(() => {
    handleResponseMessage(
      isSuccessUpdateLayer,
      isErrorUpdateLayer,
      updateLayerResponse,
      updateLayerErrorResponse,
    );

    if (isSuccessUpdateLayer && updateLayerResponse && currentEditableLayer) {
      currentEditableLayer.refresh?.();
    }
  }, [
    updateLayerResponse,
    isSuccessUpdateLayer,
    isErrorUpdateLayer,
    updateLayerErrorResponse,
  ]);

  // Handlers.
  const onColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDirty({ ...dirty, [event.target.name]: true });
    setValues({ ...values, [event.target.name]: event.target.value });
  };

  const onFillOpacityChange = (opacity: number) => {
    setDirty({ ...dirty, polygonFillOpacity: true });
    setValues({ ...values, polygonFillOpacity: opacity / 100 });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const { point, line, polygon, textbox } =
      featureStylingInputToFeatureStylesMapper(values);

    if (currentEditableLayer) {
      sendUpdateLayerRequest({
        id: currentEditableLayer.id,
        data: { featuresStyles: { point, line, polygon, textbox } },
      });

      dispatch(
        updateWorkspaceLayer({
          [currentEditableLayer.id]: {
            ...currentEditableLayer,
            featuresStyles: { point, line, polygon, textbox },
          },
        }),
      );

      drawingTools?.applyStylesToFeatures(currentEditableLayer.id, {
        polygonStyleOptions: polygon,
        lineStyleOptions: line,
        pointStyleOptions: point,
        textboxStyleOptions: textbox,
      });
    }
  };

  return (
    <div className="feature-styling-container">
      <form className="feature-styling__form" onSubmit={onSubmit}>
        <Accordion
          alwaysOpen
          variant={AccordionVariant.ChevronRight}
          className="feature-styling__accordion-container"
        >
          {/* Point Styling. */}
          <Accordion.Item
            title="point"
            eventKey="feature-style-point-accordion"
          >
            <InputGroup>
              <Input.Label>Label</Input.Label>
              <Input.Text
                value={values.pointLabel}
                name={names.pointLabel}
                placeholder="Enter feature label"
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
            <InputGroup className="feature-styling__form__color-input-group">
              <Input.Label>Color</Input.Label>
              <Input.Color
                value={values.pointColor}
                name={names.pointColor}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  onColorChange(event)
                }
              />
            </InputGroup>
          </Accordion.Item>
          {/* Line Styling. */}
          <Accordion.Item title="line" eventKey="feature-style-line-accordion">
            <InputGroup>
              <Input.Label>Label</Input.Label>
              <Input.Text
                value={values.lineLabel}
                name={names.lineLabel}
                placeholder="Enter feature label"
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
            <InputGroup className="feature-styling__form__color-input-group">
              <Input.Label>Stroke Color</Input.Label>
              <Input.Color
                value={values.lineStrokeColor}
                name={names.lineStrokeColor}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  onColorChange(event)
                }
              />
            </InputGroup>
            <InputGroup className="feature-styling__form__color-input-group">
              <Input.Label>Stroke Thickness</Input.Label>
              <Input.Number
                value={values.lineStrokeThickness}
                name={names.lineStrokeThickness}
                min={1}
                max={100}
                onKeyDown={preventNonNumber}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
          </Accordion.Item>
          {/* Polygon Styling */}
          <Accordion.Item
            title="polygon"
            eventKey="feature-style-polygon-accordion"
          >
            <InputGroup>
              <Input.Label>Label</Input.Label>
              <Input.Text
                value={values.polygonLabel}
                name={names.polygonLabel}
                placeholder="Enter feature label"
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
            <InputGroup className="feature-styling__form__polygon-input-group">
              <div className="feature-styling__form__polygon-input-group__color-section">
                <Input.Label>Fill Color</Input.Label>
                <Input.Color
                  value={values.polygonFillColor}
                  name={names.polygonFillColor}
                  onChange={onColorChange}
                />
              </div>
              <div className="feature-styling__form__polygon-input-group__fill-opacity-section">
                <Input.Label>Opacity</Input.Label>
                <OpacitySlider
                  opacity={Math.round(values.polygonFillOpacity * 100)}
                  onChangeOpacity={onFillOpacityChange}
                />
              </div>
            </InputGroup>
            <InputGroup className="feature-styling__form__color-input-group">
              <Input.Label>Stroke Color</Input.Label>
              <Input.Color
                value={values.polygonStrokeColor}
                name={names.polygonStrokeColor}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  onColorChange(event)
                }
              />
            </InputGroup>
            <InputGroup className="feature-styling__form__color-input-group">
              <Input.Label>Stroke Thickness</Input.Label>
              <Input.Number
                value={values.polygonStrokeThickness}
                name={names.polygonStrokeThickness}
                min={1}
                max={100}
                onKeyDown={preventNonNumber}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
          </Accordion.Item>
          <Accordion.Item
            title="text box"
            eventKey="feature-style-text-box-accordion"
          >
            <InputGroup className="feature-styling__form__color-input-group">
              <Input.Label>Font Color</Input.Label>
              <Input.Color
                value={values.fontColor}
                name={names.fontColor}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  onColorChange(event)
                }
              />
            </InputGroup>
            <InputGroup className="feature-styling__form__number-input-group">
              <Input.Label>Font Size</Input.Label>
              <Input.Number
                value={values.fontSize}
                name={names.fontSize}
                min={0}
                onKeyDown={preventNonNumber}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
          </Accordion.Item>
        </Accordion>
        <InputGroup className="feature-styling__form__button-group">
          <Button
            variant={ButtonVariant.Primary}
            type="submit"
            isLoading={isLoadingUpdateLayer}
            disabled={!inputIsDirty()}
          >
            Save Styles
          </Button>
        </InputGroup>
      </form>
    </div>
  );
};
