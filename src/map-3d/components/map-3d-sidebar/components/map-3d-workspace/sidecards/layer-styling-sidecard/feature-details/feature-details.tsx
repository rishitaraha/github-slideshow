import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
} from '@aus-platform/design-system';
import React, { useContext, useEffect } from 'react';
import {
  selectMap3dWorkspace,
  selectWorkspaceActionableLayers,
  updateWorkspaceLayer,
} from '../../../../../../../shared/map-3d-slices';
import { FeatureDetailsInputType, FeatureDetailsPropsType } from './types';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { UpdateLayer, handleResponseMessage, useUpdateLayer } from 'shared/api';
import { GlobalContext } from 'shared/context';
import { isOrgAdmin } from 'shared/helpers';
import { useInputFields } from 'shared/hooks';
import { AccessType } from 'src/sites/components/enums';

export const FeatureDetails: React.FC<FeatureDetailsPropsType> = ({
  layerAccessTags,
  isAccessTagListLoading,
}) => {
  // Selectors.
  const { currentEditableLayer } = useAppSelector(
    selectWorkspaceActionableLayers,
  );
  const { layerAccessControl: accessControl } =
    useAppSelector(selectMap3dWorkspace);
  const dispatch = useAppDispatch();

  // Contexts.
  const { loggedUser } = useContext(GlobalContext);

  // Constants.
  const areAccessTagsEnabled =
    (accessControl.accessType === AccessType.Advance &&
      !isOrgAdmin(loggedUser)) ||
    isOrgAdmin(loggedUser);

  // Hooks.
  const { values, names, onChange, onBlur, onFocus, inputIsDirty, setValues } =
    useInputFields<FeatureDetailsInputType>({
      layerName: currentEditableLayer?.name ?? '',
    });

  // Apis.
  const {
    mutate: sendEditLayerRequest,
    data: updateLayerResponse,
    isError: isUpdateLayerError,
    error: updateLayerError,
    isSuccess: isUpdateLayerSuccess,
    isPending: isUpdateLayerLoading,
  } = useUpdateLayer();

  // useEffects.
  useEffect(() => {
    if (currentEditableLayer) {
      setValues({ ...values, layerName: currentEditableLayer.name });
    }
  }, [currentEditableLayer]);

  useEffect(() => {
    handleResponseMessage(
      isUpdateLayerSuccess,
      isUpdateLayerError,
      updateLayerResponse,
      updateLayerError,
    );

    if (isUpdateLayerSuccess && updateLayerResponse && currentEditableLayer) {
      dispatch(
        updateWorkspaceLayer({
          [currentEditableLayer.id]: {
            ...currentEditableLayer,
            name: updateLayerResponse.data.name,
          },
        }),
      );
    }
  }, [
    isUpdateLayerError,
    isUpdateLayerSuccess,
    updateLayerError,
    updateLayerResponse,
  ]);

  // Handlers.
  const onSubmit = () => {
    if (currentEditableLayer) {
      const payload: UpdateLayer = {
        id: currentEditableLayer.id,
        data: {
          name: values.layerName,
        },
      };
      sendEditLayerRequest(payload);
    }
  };

  return (
    <div className="feature-details-container">
      <form action="" className="feature-details__form">
        <InputGroup>
          <Input.Label>Iteration Name</Input.Label>
          <Input.Text value={currentEditableLayer?.iteration?.name} disabled />
        </InputGroup>
        <InputGroup>
          <Input.Label>Layer Name</Input.Label>
          <Input.Text
            value={values.layerName}
            name={names.layerName}
            required
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>
        {areAccessTagsEnabled && (
          <InputGroup>
            <Input.Label>Access Tags</Input.Label>
            <Input.Select
              isMulti={true}
              placeholder="Layer Access Tags"
              isLoading={isAccessTagListLoading}
              value={layerAccessTags}
              isDisabled={true}
            />
          </InputGroup>
        )}
      </form>
      <InputGroup className="feature-details__form__button-group">
        <Button
          variant={ButtonVariant.Primary}
          onClick={onSubmit}
          isLoading={isUpdateLayerLoading}
          disabled={!inputIsDirty()}
        >
          Update
        </Button>
      </InputGroup>
    </div>
  );
};
