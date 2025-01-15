import {
  Button,
  ButtonVariant,
  FormMessage,
  FormMessageVariant,
  Input,
  InputGroup,
  SelectOption,
  StatusIndicatorLevel,
} from '@aus-platform/design-system';
import { isEmpty, isNil } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Modal, ModalProps } from 'react-bootstrap';
import { CesiumTerrainProvider } from 'cesium';
import {
  addTerrainLayer,
  selectMap3DState,
  selectMap3dDataset,
  setLayerAccessControl,
  setSelectedTerrainIteration,
  setSelectedTerrainSite,
} from '../../../../../shared/map-3d-slices';
import { zoomToSite } from '../../../components/map-3d-workspace/sidecards/select-dataset-sidecard/sidecard-layer-list/helpers';
import { SelectTerrainInput } from './types';
import {
  IterationListItem,
  SiteListItem,
  useIterationsList,
  useSiteList,
} from 'shared/api';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { BatchJobStatus } from 'shared/enums';

type SelectTerrainModalProps = ModalProps;

export const SelectTerrainModal: React.FC<SelectTerrainModalProps> = ({
  onHide,
}) => {
  // Selectors.
  const { selectedTerrainIteration, selectedTerrainSite, selectedProject } =
    useAppSelector(selectMap3dDataset);

  const { cesiumProxy } = useAppSelector(selectMap3DState);

  // States.
  const [siteOptionList, setSiteOptionList] =
    useState<SelectOption<SiteListItem>[]>();

  const [iterationOptionList, setIterationOptionList] =
    useState<SelectOption<IterationListItem>[]>();

  const [selectedOptions, setSelectedOptions] =
    useState<SelectTerrainInput | null>(null);

  // Dispatch.
  const dispatch = useAppDispatch();

  // Apis.
  const {
    data: siteListResponse,
    isSuccess: isSuccessSiteList,
    isLoading: isLoadingSiteList,
    isRefetching: isRefetchingSiteList,
  } = useSiteList(
    {
      projectId: selectedProject?.id,
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
      siteId: selectedOptions?.site?.value.id ?? '',
      excludeFields: ['info'],
    },
    !isNil(selectedOptions?.site?.value),
  );

  // useEffects.
  useEffect(() => {
    if (
      !isNil(selectedTerrainIteration?.name) &&
      !isNil(selectedTerrainSite?.name) &&
      !isNil(selectedTerrainSite.id)
    ) {
      setSelectedOptions({
        site: {
          label: selectedTerrainSite.name,
          value: selectedTerrainSite,
        },
        iteration: {
          label: selectedTerrainIteration.name,
          value: selectedTerrainIteration,
        },
      });
    }
  }, [selectedTerrainIteration, selectedTerrainSite]);

  useEffect(() => {
    if (siteListResponse && isSuccessSiteList) {
      setSiteOptionList(
        siteListResponse.list.map((site: SiteListItem) => ({
          label: site.name,
          value: site,
        })),
      );
    }
  }, [siteListResponse, isSuccessSiteList]);

  useEffect(() => {
    if (iterationListResponse && isSuccessIterationList) {
      const canManageIterationsAndLayers =
        iterationListResponse.canManageIterations;

      dispatch(
        setLayerAccessControl({
          accessType: iterationListResponse.accessType,
          canManageLayers: canManageIterationsAndLayers,
        }),
      );

      setIterationOptionList(
        iterationListResponse.list.map((iteration: IterationListItem) => ({
          label: iteration.name,
          value: iteration,
        })),
      );
    }
  }, [iterationListResponse, isSuccessIterationList]);

  // Constants.
  const isDSMPresent =
    selectedOptions?.iteration?.value.capturedDsm?.status ===
    StatusIndicatorLevel.Done;

  const terrainStatus = selectedOptions?.iteration?.value.terrainTiles?.status;

  const dsmCogStatus =
    selectedOptions?.iteration?.value.capturedDsmCog?.batchJob?.status;

  const isSelectIterationDisabled =
    isLoadingIterationList ||
    isRefetchingIterationList ||
    isEmpty(selectedOptions?.site?.value);

  const isOnSubmitDisabled =
    isEmpty(selectedOptions?.site?.value) ||
    isNil(selectedOptions?.iteration?.value) ||
    !isDSMPresent ||
    terrainStatus !== BatchJobStatus.Completed;

  // Handlers.
  const onSelectSite = (selectedSite: SelectOption<SiteListItem>) => {
    if (selectedSite) {
      setSelectedOptions({
        site: selectedSite,
        iteration: null,
      });
    }
  };

  const onSelectIteration = (
    selectedIteration: SelectOption<IterationListItem>,
  ) => {
    if (selectedOptions) {
      setSelectedOptions({
        ...selectedOptions,
        iteration: selectedIteration,
      });
    }
  };

  const onSubmit = () => {
    const iteration = selectedOptions?.iteration?.value;
    const site = selectedOptions?.site?.value;

    if (
      !isNil(site) &&
      !isNil(iteration) &&
      !isNil(site?.canManageIterationsAndLayers)
    ) {
      dispatch(setSelectedTerrainSite(site));
      dispatch(
        setSelectedTerrainIteration({
          ...iteration,
          canManageIterations: site?.canManageIterationsAndLayers,
        }),
      );
    }
    cesiumProxy?.layerManager.resetTerrainProvider();

    if (iteration?.terrainTiles && cesiumProxy) {
      const terrainInfo = iteration.terrainTiles;
      addTerrain(terrainInfo, iteration.id);
    }

    if (!isNil(site)) {
      zoomToSite(cesiumProxy, site);
    }

    onHide?.();
  };

  const addTerrain = async (terrainInfo, iterationId) => {
    const hasTerrainProcessingFailed =
      terrainInfo.status === BatchJobStatus.Failed;
    if (cesiumProxy && !hasTerrainProcessingFailed) {
      const isTerrainInProcess =
        terrainInfo.status === BatchJobStatus.Started ||
        terrainInfo.status === BatchJobStatus.Processing;

      let terrainProvider: CesiumTerrainProvider | undefined;
      if (!isTerrainInProcess) {
        terrainProvider = await cesiumProxy.layerManager.addTerrain(
          iterationId,
          terrainInfo.path,
        );
      }

      dispatch(
        addTerrainLayer({
          show: !isTerrainInProcess,
          terrainProvider,
          processing: isTerrainInProcess,
        }),
      );
    }
  };

  return (
    <Modal
      show={true}
      onHide={onHide}
      size="sm"
      backdrop="static"
      dialogClassName="workspace-select-terrain-modal"
      restoreFocus={false}
      centered
    >
      <Modal.Header closeButton>Select Terrain</Modal.Header>
      <Modal.Body>
        <form>
          <InputGroup>
            <Input.Label>Select Site</Input.Label>
            <Input.Select
              placeholder="Select Site"
              isLoading={isLoadingSiteList}
              options={siteOptionList}
              value={selectedOptions?.site}
              onChange={onSelectSite}
              isDisabled={isLoadingSiteList || isRefetchingSiteList}
            />
          </InputGroup>
          <InputGroup>
            <Input.Label>Select Iteration</Input.Label>
            <Input.Select
              placeholder="Select Iteration to use its DSM"
              isLoading={isLoadingIterationList}
              options={iterationOptionList}
              value={selectedOptions?.iteration}
              onChange={onSelectIteration}
              isDisabled={isSelectIterationDisabled}
            />
          </InputGroup>

          {!isNil(selectedOptions?.iteration?.value) && !isDSMPresent && (
            <FormMessage
              variant={FormMessageVariant.Error}
              message="No DSM found for selected Iteration. Please upload the DSM & try again"
            />
          )}
          {isDSMPresent && terrainStatus !== BatchJobStatus.Completed && (
            <FormMessage
              variant={FormMessageVariant.Error}
              message={
                terrainStatus === BatchJobStatus.Failed
                  ? 'Selected Iteration’s terrain generation failed'
                  : 'Selected Iteration’s terrain is being generated'
              }
            />
          )}

          {isDSMPresent &&
            terrainStatus === BatchJobStatus.Completed &&
            dsmCogStatus !== BatchJobStatus.Completed && (
              <FormMessage
                variant={FormMessageVariant.Warning}
                message={
                  dsmCogStatus === BatchJobStatus.Failed
                    ? 'Selected Iteration’s DSM processing failed. Contour tool will be disabled'
                    : 'Selected Iteration’s DSM is processing. Contour tool will be disabled'
                }
              />
            )}
        </form>
      </Modal.Body>
      <Modal.Footer className="workspace-select-terrain-modal__footer">
        <Button
          onClick={onHide}
          variant={ButtonVariant.Secondary}
          className="workspace-select-terrain-modal__footer__cancel-btn"
        >
          Cancel
        </Button>
        <Button onClick={onSubmit} type="submit" disabled={isOnSubmitDisabled}>
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
