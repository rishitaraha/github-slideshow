import {
  Button,
  Input,
  InputGroup,
  SelectOption,
} from '@aus-platform/design-system';
import { ImageryLayer } from 'cesium';
import { isEmpty, isNil, values } from 'lodash';
import React, { useEffect, useState } from 'react';
import { ChangeProjectConfirmationModal } from '../modals';
import { WorkspaceLayersContainer } from './workspace-layers-container';
import {
  WorkspaceRightSideCard,
  resetDataset,
  resetMap3DWorkspace,
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dWorkspace,
  setRightSideCard,
  setSelectedProject,
} from 'map-3d/shared/map-3d-slices';
import { useProjectList } from 'shared/api';
import { useAppDispatch, useAppSelector } from 'app/hooks';

export const WorkSpaceBody: React.FC = () => {
  const dispatch = useAppDispatch();

  // Selectors.
  const { selectedProject, selectedTerrainIteration } =
    useAppSelector(selectMap3dDataset);
  const { rightSideCard, workspaceLayers, currentEditableLayerId } =
    useAppSelector(selectMap3dWorkspace);
  const { cesiumProxy } = useAppSelector(selectMap3DState);

  // States.
  const [projectSelectOptionList, setProjectSelectOptionList] =
    useState<SelectOption<string>[]>();
  /**
   * This state is just a tracker for the last selected project
   * so that when switch project is clicked, the option which was previously selected will be selected.
   */
  const [selectedProjectOption, setSelectedProjectOption] =
    useState<SelectOption<string>>();
  const [
    showChangeProjectConfirmationModal,
    setShowProjectChangeConfirmationModal,
  ] = useState(false);

  // Constants.
  const isSelectSiteDisabled =
    rightSideCard === WorkspaceRightSideCard.Dataset || isNil(selectedProject);

  const projectOption: SelectOption<string> | null = selectedProject
    ? {
        label: selectedProject.name,
        value: selectedProject.id,
      }
    : null;

  const isProjectSelectionDisabled = !isNil(currentEditableLayerId);

  // Apis.
  const {
    data: projectListResponse,
    isSuccess: isSuccessProjectList,
    refetch: refetchProjectList,
    isFetching: isFetchingProjectList,
  } = useProjectList({
    enabled: false,
  });

  // useEffects.
  useEffect(() => {
    if (isSuccessProjectList && !isNil(projectListResponse)) {
      const projectList: SelectOption<string>[] | undefined =
        projectListResponse.data.projects.map(({ name, id }) => {
          return {
            label: name,
            value: id,
          };
        });

      setProjectSelectOptionList(projectList);
    }
  }, [isSuccessProjectList, projectListResponse]);

  // Handlers.
  const onClickSelectSite = () => {
    dispatch(setRightSideCard(WorkspaceRightSideCard.Dataset));
  };

  const onFocusSelectProject = () => {
    if (isEmpty(projectSelectOptionList)) {
      refetchProjectList();
    }
  };

  /**
   *  Clears the workspace and closes the select layer sidecard.
   */
  const resetWorkspace = () => {
    const mapLayers: ImageryLayer[] = values(workspaceLayers).reduce(
      (prevValue: ImageryLayer[], layer) => {
        if (layer.mapLayer) {
          prevValue.push(layer.mapLayer);
        }

        return prevValue;
      },
      [] as ImageryLayer[],
    );

    if (mapLayers) {
      cesiumProxy?.layerManager.removeImageryLayers(mapLayers);
    }

    dispatch(resetDataset());
    dispatch(resetMap3DWorkspace());
  };

  const closeProjectChangeConfirmationModal = () => {
    setShowProjectChangeConfirmationModal(false);
  };

  const onChangeProject = (selectedOption: SelectOption<string>) => {
    const isWorkspaceEmpty =
      isEmpty(workspaceLayers) && isNil(selectedTerrainIteration);

    setSelectedProjectOption(selectedOption);

    if (selectedProject?.id !== selectedOption.value && !isWorkspaceEmpty) {
      setShowProjectChangeConfirmationModal(true);
    }

    if (isWorkspaceEmpty) {
      dispatch(resetDataset());

      dispatch(
        setSelectedProject({
          id: selectedOption.value,
          name: selectedOption.label,
        }),
      );

      dispatch(setRightSideCard(WorkspaceRightSideCard.Dataset));
    }
  };

  const onClickSwitchProject = () => {
    if (isNil(selectedProjectOption)) {
      return;
    }

    cesiumProxy?.flyHome(2);

    resetWorkspace();

    dispatch(
      setSelectedProject({
        id: selectedProjectOption.value,
        name: selectedProjectOption.label,
      }),
    );

    dispatch(setRightSideCard(WorkspaceRightSideCard.Dataset));

    closeProjectChangeConfirmationModal();
  };

  // Renders.
  return (
    <div className="workspace-body" data-testid="left-workspace-body-sidecard">
      <InputGroup className="workspace-body__select-layer">
        <Input.Select
          placeholder="Select Project"
          value={projectOption}
          isLoading={isFetchingProjectList}
          options={projectSelectOptionList}
          onChange={onChangeProject}
          onFocus={onFocusSelectProject}
          isDisabled={isProjectSelectionDisabled}
        />
        <Button
          onClick={onClickSelectSite}
          disabled={isSelectSiteDisabled}
          data-testid="workspace-select-site-button"
        >
          Select Site
        </Button>
        <ChangeProjectConfirmationModal
          show={showChangeProjectConfirmationModal}
          onHide={closeProjectChangeConfirmationModal}
          onClickSwitchProject={onClickSwitchProject}
          data-testid="change-project-confirmation-modal"
        />
      </InputGroup>

      <WorkspaceLayersContainer />
    </div>
  );
};
