import { CesiumViewer } from '@aus-platform/cesium';
import { Input, InputGroup, SelectOption } from '@aus-platform/design-system';
import { EllipsoidTerrainProvider, ImageryLayer } from 'cesium';
import { filter, isEmpty, isNil } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  IterationListItem,
  LayerType,
  SiteListItem,
  useIterationsList,
  useLayerList,
  useProjectList,
  useSiteList,
} from '../../../shared/api';
import {
  CesiumProxy,
  baseMapImageryProvider,
  defaultCesiumViewerOptions,
} from '../../../shared/cesium';
import { BatchJobStatus } from '../../../shared/enums';
import { EnvVariables } from '../../../shared/env-variables';
import {
  selectDashboardDataset,
  setCesiumProxy,
  setProject,
  setSite,
  setUserSiteManagePermission,
} from '../../dashboard-slices';
import { MapNavigationControls } from 'src/shared/components';

export const DashboardMap = () => {
  // Refs.
  const cesiumContainerRef = useRef<HTMLDivElement>(null);

  // Selectors
  const { cesiumProxy, ...dataset } = useAppSelector(selectDashboardDataset);

  // States.
  const [projects, setProjects] = useState<SelectOption[]>();
  const [sites, setSites] = useState<SelectOption<SiteListItem>[]>();
  const [selectedIteration, setSelectedIteration] =
    useState<IterationListItem | null>(null);
  const [addedOrthoLayers, setAddedOrthoLayers] = useState<ImageryLayer[]>([]);

  // Hooks.
  const dispatch = useAppDispatch();

  // APIs.
  const {
    data: projectListResponse,
    isLoading: isLoadingProjectList,
    isSuccess: isSuccessProjectList,
  } = useProjectList();

  const {
    data: siteListResponse,
    isLoading: isLoadingSiteList,
    isSuccess: isSuccessSiteList,
  } = useSiteList(
    {
      projectId: dataset.project?.value ?? '',
      excludeFields: ['canManageIterationsAndLayers'],
    },
    !isNil(dataset.project),
  );

  const {
    data: iterationListResponse,
    isSuccess: isSuccessIterationList,
    refetch: refetchIterationList,
  } = useIterationsList(
    {
      siteId: dataset.site?.value.id ?? '',
    },
    false,
  );

  const { data: layerListResponse, isSuccess: isSuccessLayerList } =
    useLayerList(
      {
        iterationId: selectedIteration?.id ?? null,
        includeFields: ['type', 'sourceId', 'files'],
      },
      !isNil(selectedIteration?.id),
    );

  // useEffects.
  useEffect(() => {
    if (cesiumContainerRef.current) {
      const dashboardCesiumProxy = new CesiumProxy(
        new CesiumViewer(
          cesiumContainerRef.current,
          EnvVariables.cesiumAccessToken,
          {
            ...defaultCesiumViewerOptions,
            // Ref: https://stackoverflow.com/questions/54985128/print-or-export-cesium-map-loading-division
            contextOptions: {
              webgl: { preserveDrawingBuffer: true },
            },
          },
        ),
      );

      // Add google map base layer.
      dashboardCesiumProxy.viewer?.imageryLayers.addImageryProvider(
        baseMapImageryProvider,
        0,
      );

      dispatch(setCesiumProxy(dashboardCesiumProxy));
    }
  }, []);

  useEffect(() => {
    if (projectListResponse && isSuccessProjectList) {
      setProjects(
        projectListResponse.data.projects.map((project) => {
          return { label: project.name, value: project.id };
        }),
      );
    }
  }, [projectListResponse, isSuccessProjectList]);

  useEffect(() => {
    if (siteListResponse && isSuccessSiteList) {
      dispatch(setUserSiteManagePermission(siteListResponse.canManageSites));
      setSites(
        siteListResponse.list.map((site) => {
          return { label: site.name, value: site };
        }),
      );
    }
  }, [siteListResponse, isSuccessSiteList]);

  useEffect(() => {
    if (iterationListResponse && isSuccessIterationList && cesiumProxy) {
      if (!isEmpty(addedOrthoLayers)) {
        //  Removing previous orthos.
        cesiumProxy.layerManager.removeImageryLayers(addedOrthoLayers);
        setAddedOrthoLayers([]);
      }

      // Removing previous terrain.
      cesiumProxy.layerManager.setTerrainProvider(
        new EllipsoidTerrainProvider({}),
      );

      const latestIteration = iterationListResponse.list?.[0];
      setSelectedIteration(latestIteration);
    }
  }, [iterationListResponse, isSuccessIterationList]);

  // useEffect - Refetch iteration if site changes.
  useEffect(() => {
    if (dataset.site?.value.id) {
      refetchIterationList();
    }
  }, [dataset.site?.value.id]);

  // useEffect - Add ortho after fetching layer list.
  // TODO: Handle removal of ortho and terrain when iteration is changed.
  useEffect(() => {
    if (isSuccessLayerList && layerListResponse && cesiumProxy) {
      const addedMapLayer: ImageryLayer[] = [];
      const orthoLayers = filter(layerListResponse.list, {
        type: LayerType.Orthomosaic,
      });

      orthoLayers.map((layer) => {
        cesiumProxy.layerManager.addMapLayer({ layer }).then((imageryLayer) => {
          imageryLayer && addedMapLayer.push(imageryLayer);
        });
      });

      setAddedOrthoLayers([...addedOrthoLayers, ...addedMapLayer]);
    }
  }, [layerListResponse, isSuccessLayerList, cesiumProxy]);

  // useEffect - Add terrain after iteration is selected.
  useEffect(() => {
    if (selectedIteration) {
      const terrainInfo = selectedIteration.terrainTiles;

      // Adding terrain tiles in map.
      if (terrainInfo?.status === BatchJobStatus.Completed) {
        cesiumProxy?.layerManager.addTerrain(
          selectedIteration.id,
          terrainInfo.path,
        );
      }
    }
  }, [selectedIteration]);

  // Handlers.
  const onProjectChange = (selectedProject: SelectOption) => {
    dispatch(setProject(selectedProject));
  };

  const onSiteChange = (selectedSite: SelectOption<SiteListItem>) => {
    dispatch(setSite(selectedSite));

    // Zooming camera to the site location.
    const longitude = selectedSite.value.longitude.toString();
    const latitude = selectedSite.value.latitude.toString();

    cesiumProxy?.flyTo({ longitude, latitude });
    cesiumProxy?.setNavigationResetLocation(longitude, latitude);
  };

  return (
    <div className="dashboard-map" ref={cesiumContainerRef}>
      <header className="dashboard-map__header">
        <span className="dashboard-map__header__title">Dataset</span>
        <div className="dashboard-map__header__input-container">
          <InputGroup>
            <Input.Label>Select Project</Input.Label>
            <Input.Select
              className="dashboard-map__header__input"
              placeholder="Select Project"
              options={projects}
              value={dataset.project}
              isLoading={isLoadingProjectList}
              onChange={onProjectChange}
            />
          </InputGroup>
          <InputGroup>
            <Input.Label>Select Site</Input.Label>
            <Input.Select
              className="dashboard-map__header__input"
              placeholder="Select Site"
              options={sites}
              value={dataset.site}
              isLoading={isLoadingSiteList}
              isDisabled={!dataset.project}
              onChange={onSiteChange}
            />
          </InputGroup>
        </div>
      </header>
      <MapNavigationControls cesiumProxy={cesiumProxy} />
    </div>
  );
};
