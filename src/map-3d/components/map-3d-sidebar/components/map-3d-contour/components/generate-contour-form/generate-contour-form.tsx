import {
  Button,
  ButtonVariant,
  IconIdentifier,
  Input,
  InputGroup,
  SelectOption,
  Spinner,
} from '@aus-platform/design-system';
import { isEmpty, isUndefined } from 'lodash';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../../../../app/hooks';
import {
  ContourPayloadType,
  handleResponseMessage,
  useAccessTagList,
  useGenerateContour,
} from '../../../../../../../shared/api';
import { GlobalContext } from '../../../../../../../shared/context';
import {
  isOrgAdmin,
  preventNonInteger,
  preventNonNumber,
} from '../../../../../../../shared/helpers';
import { useInputFields } from '../../../../../../../shared/hooks';
import { AccessType } from '../../../../../../../sites/components/enums';
import {
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dWorkspace,
  setCurrentActiveMapTool,
} from '../../../../../../shared/map-3d-slices';
import {
  IPolygonTool,
  PolygonEventType,
  PolygonTool,
} from '../../../../../../shared/map-3d-tools';
import { MapTool } from '../../../../../map-3d-container/map-3d-tools';
import {
  ContourFormType,
  ContourValidatorType,
  GenerateContourFormProps,
} from '../../types';
import { contourValidator } from './validators';

export const GenerateContourForm: React.FC<GenerateContourFormProps> = ({
  setShowContourForm,
  dsmElevationBounds,
}) => {
  // Refs.
  const polygonTool = useRef<IPolygonTool>();

  // Contexts.
  const { loggedUser } = useContext(GlobalContext);

  // Dispatcher.
  const dispatch = useAppDispatch();

  // States.
  const [accessTagsList, setAccessTagsList] =
    useState<SelectOption<string>[]>();
  const [isDrawToolActive, setIsDrawToolActive] = useState(false);

  // Selectors.
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);
  const { layerAccessControl: accessControl } =
    useAppSelector(selectMap3dWorkspace);

  // useMemo.
  const areAccessTagsEnabled = useMemo(() => {
    return (
      (accessControl.accessType === AccessType.Advance &&
        !isOrgAdmin(loggedUser)) ||
      isOrgAdmin(loggedUser)
    );
  }, []);

  // Constants.
  const contourInputInitialState: ContourFormType = {
    name: '',
    accessTags: [],
    minorInterval: 5,
    majorInterval: 10,
    lowestAltitude: dsmElevationBounds?.min ?? 0,
    highestAltitude: dsmElevationBounds?.max ?? 0,
    thresholdValue: 5,
    smoothingFilterSize: 10,
  };

  const validatorInitialState: ContourValidatorType = {
    highestAltitude: {
      lowerBound: 0,
    },
    lowestAltitude: {
      upperBound: 0,
    },
    accessTags: {
      isUserOrgAdmin: isOrgAdmin(loggedUser),
    },
  };

  // Hooks.
  const {
    values,
    names,
    errors,
    setErrors,
    setValues,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    validatorParams,
    setValidatorParams,
  } = useInputFields<ContourFormType>(
    contourInputInitialState,
    contourValidator,
    true,
    false,
    validatorInitialState,
  );

  // Api.
  const {
    data: accessTagsListResponse,
    isSuccess: isSuccessAccessTag,
    isLoading: isLoadingAccessTags,
  } = useAccessTagList();

  const {
    mutate: sendContourRequest,
    data: contourGenerationResponse,
    isSuccess: isSuccessContourGeneration,
    isError: isErrorContourGeneration,
    isPending: isLoadingContourGeneration,
    error: contourGenerationError,
  } = useGenerateContour();

  // useEffects.
  useEffect(() => {
    if (cesiumProxy) {
      polygonTool.current = new PolygonTool(cesiumProxy.cesiumViewer);
    }

    polygonTool.current?.addEventListener(
      PolygonEventType.DrawingEnd,
      endPolygonDrawingListener,
    );

    return () => {
      polygonTool.current?.removeEventListener(
        PolygonEventType.DrawingEnd,
        endPolygonDrawingListener,
      );
      polygonTool.current?.deletePolygonsByProperty('isCountour', true);
      polygonTool.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (isSuccessAccessTag && accessTagsListResponse) {
      const accessTags = accessTagsListResponse.data.list.map((accessTag) => {
        return {
          value: accessTag.id,
          label: accessTag.name,
        };
      });
      setAccessTagsList(accessTags);
    }
  }, [isSuccessAccessTag, accessTagsListResponse]);

  useEffect(() => {
    handleResponseMessage(
      isSuccessContourGeneration,
      isErrorContourGeneration,
      contourGenerationResponse,
      contourGenerationError,
    );

    if (isSuccessContourGeneration && contourGenerationResponse) {
      setShowContourForm(false);
    }
  }, [
    isSuccessContourGeneration,
    isErrorContourGeneration,
    contourGenerationError,
    contourGenerationResponse,
  ]);

  useEffect(() => {
    if (!dsmElevationBounds) {
      return;
    }

    setValidatorParams({
      ...validatorInitialState,
      highestAltitude: {
        lowerBound: dsmElevationBounds.min,
        upperBound: dsmElevationBounds.max,
      },
      lowestAltitude: {
        lowerBound: dsmElevationBounds.min,
        upperBound: dsmElevationBounds.max,
      },
    });
  }, [dsmElevationBounds]);

  // Handlers.
  const isGenerateContourButtonDisabled = () => {
    if (areAccessTagsEnabled) {
      return inputHasError();
    }
    return inputHasError([names.accessTags]);
  };

  const generateContour = () => {
    if (!dsmElevationBounds) {
      return;
    }

    if (!isGenerateContourButtonDisabled()) {
      const polygonWKT = polygonTool.current?.exportCurrentPolygonsToWkt();
      let wktString: string | null = null;
      if (!isUndefined(polygonWKT) && !isEmpty(polygonWKT)) {
        wktString = polygonWKT[0].wkt;
      }
      const contourPayload: ContourPayloadType = {
        ...values,
        accessTags: values.accessTags?.map(
          (accessTagOption) => accessTagOption.value,
        ),
        iteration: selectedTerrainIteration?.id ?? '',
        polygonWkt: wktString,
      };

      sendContourRequest(contourPayload);
    }
  };

  const onClickDrawPolygon = () => {
    polygonTool.current?.activate({ isContour: true }, {}, true, true);
    polygonTool.current?.deleteAllPolygons();
    setIsDrawToolActive(true);
    dispatch(setCurrentActiveMapTool(MapTool.None));
  };

  // Listeners.
  const endPolygonDrawingListener = () => {
    setIsDrawToolActive(false);
  };

  return isLoadingContourGeneration ? (
    <Spinner />
  ) : (
    <div className="generate-contour">
      <Button
        className="generate-contour__polygon-btn"
        variant={ButtonVariant.Outline}
        leftIconIdentifier={IconIdentifier.Polygon}
        onClick={onClickDrawPolygon}
        disabled={isDrawToolActive}
      >
        Draw Polygon
      </Button>
      <form onSubmit={generateContour} className="generate-contour__form">
        {/* Basic info for contour */}
        <InputGroup className="generate-contour__form__group">
          <Input.Label isRequired={true}>Contour Name</Input.Label>
          <Input.Text
            placeholder="Contour name"
            value={values.name}
            name={names.name}
            error={errors.name}
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>
        {areAccessTagsEnabled && (
          <InputGroup className="generate-contour__form__group">
            {/* Acces Tags are mandatory only for users who are not an org admin. */}
            <Input.Label isRequired={!isOrgAdmin(loggedUser)}>
              Access Tags
            </Input.Label>
            <Input.Select
              placeholder="Select Access Tags"
              options={accessTagsList}
              isMulti={true}
              name={names.accessTags}
              value={values.accessTags}
              error={errors.accessTags}
              isLoading={isLoadingAccessTags}
              onChange={(selectedAccessTags) => {
                setValues({ ...values, accessTags: selectedAccessTags });
              }}
              onBlur={() => {
                setErrors({
                  ...errors,
                  accessTags: contourValidator(
                    'accessTags',
                    values,
                    undefined,
                    validatorParams,
                  ),
                });
              }}
              onFocus={() => {
                setErrors({
                  ...errors,
                  accessTags: '',
                });
              }}
            />
          </InputGroup>
        )}

        {/* Contour Interval */}
        <InputGroup className="generate-contour__form__group">
          <p className="generate-contour__form__header">Contour Interval</p>
          <div className="input-pair">
            <div className="input-pair__element">
              <Input.Label isRequired={true}>Minor Interval (m)</Input.Label>
              <Input.Number
                value={values.minorInterval}
                name={names.minorInterval}
                error={errors.minorInterval}
                min={0}
                onKeyDown={preventNonNumber}
                {...{ onChange, onBlur, onFocus }}
              />
            </div>
            <div className="input-pair__element">
              <Input.Label isRequired={true}>Major Interval (m)</Input.Label>
              <Input.Number
                value={values.majorInterval}
                name={names.majorInterval}
                error={errors.majorInterval}
                min={0}
                onKeyDown={preventNonNumber}
                {...{ onChange, onBlur, onFocus }}
              />
            </div>
          </div>
        </InputGroup>
        {/* Altitude Range */}
        <InputGroup className="generate-contour__form__group">
          <p className="generate-contour__form__header">Altitude Range</p>
          <div className="input-pair">
            <div className="input-pair__element">
              <Input.Label isRequired={true}>Lowest (m)</Input.Label>
              <Input.Number
                value={values.lowestAltitude}
                name={names.lowestAltitude}
                error={errors.lowestAltitude}
                onKeyDown={preventNonInteger}
                step={1}
                // lowest alitude (in contour) <= highest altitude (in dsm) to prevent selection of altitude values (in range highest altitude to ∞) which in-turn would generate no contour.
                max={dsmElevationBounds?.max}
                {...{ onChange, onBlur, onFocus }}
              />
            </div>
            <div className="input-pair__element">
              <Input.Label isRequired={true}>Highest (m)</Input.Label>
              <Input.Number
                value={values.highestAltitude}
                name={names.highestAltitude}
                error={errors.highestAltitude}
                onKeyDown={preventNonInteger}
                step={1}
                // highest altitude (in contour)>= lowest altitude (in dsm) to prevent selection of altitude values (in range 0 to lowest altitude) which in-turn would generate no contour.
                min={dsmElevationBounds?.min}
                {...{ onChange, onBlur, onFocus }}
              />
            </div>
          </div>
        </InputGroup>
        {/* Contour Smoothing  */}
        <InputGroup className="generate-contour__form__group">
          <p className="generate-contour__form__header">Contour Smoothing</p>
          <div className="input-pair">
            <div className="input-pair__element">
              <Input.Label isRequired={true}>Threshold Value (m)</Input.Label>
              <Input.Number
                value={values.thresholdValue}
                name={names.thresholdValue}
                error={errors.thresholdValue}
                min={0}
                onKeyDown={preventNonNumber}
                {...{ onChange, onBlur, onFocus }}
              />
            </div>
            <div className="input-pair__element">
              <Input.Label isRequired={true}>Smoothing Filter Size</Input.Label>
              <Input.Number
                value={values.smoothingFilterSize}
                name={names.smoothingFilterSize}
                error={errors.smoothingFilterSize}
                min={0}
                onKeyDown={preventNonNumber}
                {...{ onChange, onBlur, onFocus }}
              />
            </div>
          </div>
        </InputGroup>
        <Button
          className="generate-contour-btn"
          onClick={generateContour}
          disabled={isGenerateContourButtonDisabled()}
        >
          Generate Contour
        </Button>
      </form>
    </div>
  );
};
