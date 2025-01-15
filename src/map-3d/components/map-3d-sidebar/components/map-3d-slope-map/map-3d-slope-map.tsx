import {
  Button,
  Input,
  InputGroup,
  SelectOption,
} from '@aus-platform/design-system';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../../../../app/hooks';
import {
  SlopeMapPayloadType,
  handleResponseErrorMessage,
  handleResponseMessage,
  useAccessTagList,
  useGenerateSlopeMap,
} from '../../../../../shared/api';
import { GlobalContext } from '../../../../../shared/context';
import { isOrgAdmin } from '../../../../../shared/helpers';
import { useInputFields } from '../../../../../shared/hooks';
import { AccessType } from '../../../../../sites/components/enums';
import {
  selectMap3dDataset,
  selectMap3dWorkspace,
} from '../../../../shared/map-3d-slices';
import { GeneratingOutput, Map3DNoTerrainSelected } from '../../shared';
import { Map3DSidebarOption } from '../../shared/enums';
import { slopeMapValidator } from './validators';

type SlopeMapFormType = {
  slopeName: string;
  accessTags: SelectOption[];
};

const slopeMapInitialState: SlopeMapFormType = {
  slopeName: '',
  accessTags: [],
};

export const Map3DSlopeMap: React.FC = () => {
  // Contexts.
  const { loggedUser } = useContext(GlobalContext);

  // Selectors.
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);
  const { layerAccessControl: accessControl } =
    useAppSelector(selectMap3dWorkspace);

  // States.
  const [accessTagList, setAccessTagList] = useState<SelectOption[]>([]);
  const [isSlopeMapGenerating, setIsSlopeMapGenerating] =
    useState<boolean>(false);

  // useMemo.
  const areAccessTagsEnabled = useMemo(() => {
    return (
      (accessControl.accessType === AccessType.Advance &&
        !isOrgAdmin(loggedUser)) ||
      isOrgAdmin(loggedUser)
    );
  }, []);

  // Api.
  const {
    data: accessTagsListResponse,
    isSuccess: isAccessTagsListSuccess,
    isLoading: isAccessTagsListLoading,
    isError: isAccessTagsListError,
    error: accessTagsListError,
  } = useAccessTagList();

  const {
    mutate: sendGenerateSlopeMapRequest,
    data: generateSlopeMapResponse,
    isSuccess: isGenerateSlopeMapSuccess,
    isError: isGenerateSlopeMapError,
    error: generateSlopeMapError,
  } = useGenerateSlopeMap();

  // Constants.
  const slopeMapValidatorInitialState = {
    accessTags: {
      isUserOrgAdmin: isOrgAdmin(loggedUser),
    },
  };

  // Hooks.
  const {
    values,
    setValues,
    names,
    errors,
    onBlur,
    onChange,
    onFocus,
    inputHasError,
    resetAll,
  } = useInputFields<SlopeMapFormType>(
    slopeMapInitialState,
    slopeMapValidator,
    true,
    false,
    slopeMapValidatorInitialState,
  );

  // useEffects.
  useEffect(() => {
    if (isAccessTagsListSuccess && accessTagsListResponse) {
      const accessTags = accessTagsListResponse.data.list.map((accessTag) => {
        return {
          label: accessTag.name,
          value: accessTag.id,
        };
      });
      setAccessTagList(accessTags);
    }
  }, [isAccessTagsListSuccess, accessTagsListResponse]);

  useEffect(() => {
    handleResponseErrorMessage(isAccessTagsListError, accessTagsListError);
  }, [isAccessTagsListError, accessTagsListError]);

  useEffect(() => {
    handleResponseMessage(
      isGenerateSlopeMapSuccess,
      isGenerateSlopeMapError,
      generateSlopeMapResponse,
      generateSlopeMapError,
    );

    if (isGenerateSlopeMapSuccess && generateSlopeMapResponse) {
      setIsSlopeMapGenerating(true);
    }
  }, [
    isGenerateSlopeMapError,
    generateSlopeMapError,
    isGenerateSlopeMapSuccess,
    generateSlopeMapResponse,
  ]);

  // Reset all values when generate new slope map is clicked.
  useEffect(() => {
    if (!isSlopeMapGenerating) {
      resetAll();
      setValues(slopeMapInitialState);
    }
  }, [isSlopeMapGenerating]);

  // Handlers.
  const submitSlopeMapForm = () => {
    if (!isGenerateSlopeButtonDisabled()) {
      const payload: SlopeMapPayloadType = {
        name: values.slopeName,
        accessTags: values.accessTags?.map((accessTag) => accessTag.value),
        iteration: selectedTerrainIteration?.id ?? '',
      };

      sendGenerateSlopeMapRequest(payload);
    }
  };

  const isGenerateSlopeButtonDisabled = () => {
    if (areAccessTagsEnabled) {
      return inputHasError();
    }
    return inputHasError([names.accessTags]);
  };

  const renderSlopeMapForm = () => {
    if (!selectedTerrainIteration?.id) {
      return <Map3DNoTerrainSelected />;
    } else if (!isSlopeMapGenerating) {
      return (
        <form>
          <InputGroup>
            <Input.Label isRequired>Slope Name</Input.Label>
            <Input.Text
              name={names.slopeName}
              value={values.slopeName}
              error={errors.slopeName}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>
          {areAccessTagsEnabled && (
            <InputGroup>
              <Input.Label isRequired={!isOrgAdmin(loggedUser)}>
                Access Tags
              </Input.Label>
              <Input.Select
                placeholder="Select Access Tags"
                name={names.accessTags}
                error={errors.accessTags}
                isMulti={true}
                isLoading={isAccessTagsListLoading}
                options={accessTagList}
                onChange={(selectedAccessTags) => {
                  setValues({
                    ...values,
                    accessTags: selectedAccessTags,
                  });
                }}
                {...{ onBlur, onFocus }}
              />
            </InputGroup>
          )}

          <InputGroup>
            <Button
              onClick={submitSlopeMapForm}
              disabled={isGenerateSlopeButtonDisabled()}
            >
              Generate Slope Map
            </Button>
          </InputGroup>
        </form>
      );
    } else if (isSlopeMapGenerating) {
      return (
        <GeneratingOutput
          currentAnalyticsOption={Map3DSidebarOption.SlopeMap}
          setShowCurrentForm={() => {
            setIsSlopeMapGenerating(false);
          }}
        />
      );
    }
  };

  return (
    <div className="map-3d-slope-map map-3d-sidebar-content">
      {renderSlopeMapForm()}
    </div>
  );
};
