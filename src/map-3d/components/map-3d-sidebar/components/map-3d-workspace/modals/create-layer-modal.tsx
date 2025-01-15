import {
  Button,
  Input,
  InputGroup,
  SelectOption,
} from '@aus-platform/design-system';
import { isNil, size } from 'lodash';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { createWorkspaceLayer } from '../workspace-body';
import { zoomToLayer } from '../shared';
import { CreateLayerModalProps, CreateNewLayerInputType } from './types';
import {
  IterationListItem,
  LayerType,
  SiteListItem,
  handleResponseMessage,
  useAccessTagList,
  useAddLayer,
  useIterationsList,
  useSiteList,
} from 'shared/api';
import { GlobalContext } from 'shared/context';
import { isOrgAdmin, validate } from 'shared/helpers';
import { useInputFields } from 'shared/hooks';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
  WorkspaceRightSideCard,
  addWorkspaceLayer,
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dWorkspace,
  setCurrentEditableLayerId,
  setRightSideCard,
} from 'map-3d/shared/map-3d-slices';
import { AccessType } from 'src/sites/components/enums';

export const CreateLayerModal: React.FC<CreateLayerModalProps> = ({
  onHide,
}) => {
  // useContexts.
  const { loggedUser } = useContext(GlobalContext);

  // States.
  const [siteOptionList, setSiteOptionList] =
    useState<SelectOption<SiteListItem>[]>();
  const [iterationOptionList, setIterationOptionList] =
    useState<SelectOption<IterationListItem>[]>();
  const [accessTags, setAccessTags] = useState<SelectOption[]>();

  // Hooks.
  const dispatch = useAppDispatch();

  // Selectors.
  const { selectedProject, activeWorkspaceIteration, activeWorkspaceSite } =
    useAppSelector(selectMap3dDataset);
  const { layerAccessControl: accessControl } =
    useAppSelector(selectMap3dWorkspace);
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const { workspaceLayers: workspaceLayerList } =
    useAppSelector(selectMap3dWorkspace);

  // Constants.
  const defaultSelectedSite = !isNil(activeWorkspaceSite)
    ? {
        label: activeWorkspaceSite.name,
        value: activeWorkspaceSite,
      }
    : null;

  const defaultSelectedIteration = !isNil(activeWorkspaceIteration)
    ? {
        label: activeWorkspaceIteration.name,
        value: activeWorkspaceIteration,
      }
    : null;

  const createNewLayerInitialState: CreateNewLayerInputType = {
    name: '',
    accessTags: null,
    site: defaultSelectedSite,
    iteration: defaultSelectedIteration,
  };

  // useMemo.
  const areAccessTagsEnabled = useMemo(() => {
    return (
      (accessControl.accessType === AccessType.Advance &&
        !isOrgAdmin(loggedUser)) ||
      isOrgAdmin(loggedUser)
    );
  }, []);

  // Hooks.
  const {
    names,
    values,
    errors,
    optional,
    onChange,
    onBlur,
    onFocus,
    setValues,
    setErrors,
    inputHasError,
    inputIsDirty,
    setOptional,
    validateAllFields,
  } = useInputFields<CreateNewLayerInputType>(createNewLayerInitialState);

  // Apis.
  const {
    mutate: sendCreateLayerRequest,
    data: createLayerResponse,
    isError: isErrorCreateLayer,
    isPending: isLoadingCreateLayer,
    isSuccess: isSuccessCreateLayer,
    error: createLayerErrorResponse,
  } = useAddLayer();

  const {
    data: accessTagListResponse,
    isSuccess: isSuccessAccessTags,
    isLoading: isLoadingAccessTags,
  } = useAccessTagList();

  const {
    data: siteListResponse,
    isSuccess: isSuccessSiteList,
    isLoading: isLoadingSiteList,
    isRefetching: isRefetchingSiteList,
  } = useSiteList(
    {
      projectId: selectedProject?.id ?? '',
    },
    !!selectedProject,
  );

  const {
    data: iterationListResponse,
    isSuccess: isSuccessIterationList,
    isLoading: isLoadingIterationList,
    isRefetching: isRefetchingIterationList,
  } = useIterationsList(
    {
      siteId: values.site?.value.id ?? '',
    },
    !!values.site?.value,
  );

  // useEffects.
  useEffect(() => {
    setOptional({
      ...optional,
      accessTags:
        (areAccessTagsEnabled && isOrgAdmin(loggedUser)) ||
        !areAccessTagsEnabled,
    });
  }, []);

  useEffect(() => {
    if (accessTagListResponse && isSuccessAccessTags) {
      setAccessTags(
        accessTagListResponse.data.list.map(({ id, name }) => ({
          label: name,
          value: id,
        })),
      );
    }
  }, [accessTagListResponse, isSuccessAccessTags]);

  useEffect(() => {
    if (siteListResponse && isSuccessSiteList) {
      setSiteOptionList(
        siteListResponse.list
          .filter(
            ({ canManageIterationsAndLayers }) => canManageIterationsAndLayers,
          )
          .map((site: SiteListItem) => {
            return {
              label: site.name,
              value: site,
            };
          }),
      );
    }
  }, [siteListResponse, isSuccessSiteList]);

  useEffect(() => {
    if (iterationListResponse && isSuccessIterationList) {
      setIterationOptionList(
        iterationListResponse.list.map((iteration) => {
          return {
            label: iteration.name,
            value: iteration,
          };
        }),
      );
    }
  }, [iterationListResponse, isSuccessIterationList]);

  useEffect(() => {
    if (
      isNil(createLayerResponse) ||
      isNil(values.iteration) ||
      isNil(values.site) ||
      isNil(selectedProject)
    ) {
      return;
    }

    const workspaceLayer = createWorkspaceLayer({
      layer: createLayerResponse.data,
      project: selectedProject,
      site: values.site.value,
      iteration: values.iteration.value,
    });

    if (size(workspaceLayerList) === 0) {
      zoomToLayer(workspaceLayer, cesiumProxy, values.site.value);
    }

    handleResponseMessage(
      isSuccessCreateLayer,
      isErrorCreateLayer,
      createLayerResponse,
      createLayerErrorResponse,
    );

    // Add newly created layer to workspace.
    dispatch(addWorkspaceLayer(workspaceLayer));

    dispatch(setCurrentEditableLayerId(workspaceLayer.id));

    dispatch(setRightSideCard(WorkspaceRightSideCard.FeatureStyling));
    onHide?.();
  }, [createLayerResponse, createLayerErrorResponse]);

  // Handlers.
  const onSiteChange = (selectedSiteOption: SelectOption<SiteListItem>) => {
    setValues({ ...values, site: selectedSiteOption, iteration: null });
  };

  const onIterationChange = (selectedIterationOption) => {
    setValues({ ...values, iteration: selectedIterationOption });
  };

  const onSubmit = (event) => {
    event.preventDefault();

    if (!inputHasError() && inputIsDirty() && !isNil(values.iteration)) {
      sendCreateLayerRequest({
        name: values.name,
        type: LayerType.Vector,
        iteration: values.iteration.value.id,
        sourceId: null,
        accessTags: values.accessTags?.map(({ value }) => value),
      });
    } else {
      validateAllFields();
    }
  };

  return (
    <Modal
      show={true}
      onHide={onHide}
      size="sm"
      backdrop="static"
      dialogClassName="workspace-create-layer-modal"
      restoreFocus={false}
      centered
    >
      <Modal.Header
        closeButton
        data-testid="workspace-create-layer-modal-header-content"
      >
        Create New Layer
      </Modal.Header>
      <Modal.Body data-testid="workspace-create-layer-modal-body-content">
        <form>
          <InputGroup>
            <Input.Label isRequired>Layer Name</Input.Label>
            <Input.Text
              className="workspace-create-layer-modal__layer-name"
              name={names.name}
              error={errors.name}
              value={values.name}
              placeholder="Layer Name"
              {...{ onChange, onBlur, onFocus }}
            ></Input.Text>
          </InputGroup>
          {areAccessTagsEnabled && (
            <InputGroup>
              <Input.Label isRequired={!isOrgAdmin(loggedUser)}>
                Access Tags
              </Input.Label>
              <Input.Select
                isMulti
                placeholder="Select Access Tags"
                options={accessTags}
                value={values.accessTags}
                name={names.accessTags}
                isLoading={isLoadingAccessTags}
                error={errors.accessTags}
                onChange={(selectedAccessTags) =>
                  setValues({ ...values, accessTags: selectedAccessTags })
                }
                onFocus={() =>
                  setErrors({
                    ...errors,
                    accessTags: '',
                  })
                }
                onBlur={() => {
                  if (!isOrgAdmin(loggedUser)) {
                    setErrors({
                      ...errors,
                      accessTags: validate('accessTags', values),
                    });
                  }
                }}
              />
            </InputGroup>
          )}
          <div className="workspace-create-layer-modal__select-group">
            <InputGroup>
              <Input.Label
                info="Only sites with manage iterations & layers permission are shown"
                isRequired
              >
                Select Site
              </Input.Label>
              <Input.Select
                className="workspace-create-layer-modal__select-group__field"
                placeholder="Select Site"
                required
                error={errors.site}
                isLoading={isLoadingSiteList}
                options={siteOptionList}
                value={values.site}
                onChange={onSiteChange}
                isDisabled={isLoadingSiteList || isRefetchingSiteList}
                {...{ onBlur, onFocus }}
              />
            </InputGroup>
            <InputGroup>
              <Input.Label isRequired>Select Iteration</Input.Label>
              <Input.Select
                className="workspace-create-layer-modal__select-group__field"
                placeholder="Select Iteration"
                required
                error={errors.iteration}
                isLoading={isLoadingIterationList}
                options={iterationOptionList}
                value={values.iteration}
                onChange={onIterationChange}
                isDisabled={isLoadingIterationList || isRefetchingIterationList}
                {...{ onBlur, onFocus }}
              />
            </InputGroup>
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer className="workspace-create-layer-modal__footer">
        <Button
          type="submit"
          isLoading={isLoadingCreateLayer}
          onClick={onSubmit}
          disabled={inputHasError()}
          data-testid="workspace-create-layer-modal-create-button"
        >
          Create
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
